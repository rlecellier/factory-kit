import { createFactory } from '@/factory';
import { faker } from '@faker-js/faker';

// Test interfaces
interface UserOutput {
  id: number;
  fullName: string;
  email: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

interface AddressOutput {
  street: string;
  city: string;
  formattedAddress: string;
}

interface UserWithAddress extends UserOutput {
  address: AddressOutput;
}

describe('Transient Attributes', () => {
  beforeEach(() => {
    // Ensure consistent results for tests
    faker.seed(123);
  });

  it('excludes transient attributes from the built object', () => {
    const userFactory = createFactory<UserOutput>().define(
      {
        id: () => faker.datatype.number(),
        _firstName: () => 'John',
        _lastName: () => 'Doe',
        fullName: ({ _firstName, _lastName }) => `${_firstName} ${_lastName}`,
        email: ({ _firstName, _lastName }) =>
          `${_firstName.toLowerCase()}.${_lastName.toLowerCase()}@example.com`,
      },
      { transientAttributes: ['_firstName', '_lastName'] }
    );

    const user = userFactory.build();

    // Verify computed properties use transient attributes
    expect(user.fullName).toBe('John Doe');
    expect(user.email).toBe('john.doe@example.com');

    // Verify transient attributes are not in the final object
    expect(user).not.toHaveProperty('_firstName');
    expect(user).not.toHaveProperty('_lastName');

    // Verify the object shape
    expect(Object.keys(user).sort()).toEqual(
      ['email', 'fullName', 'id'].sort()
    );
  });

  it('works with trait overrides', () => {
    const userFactory = createFactory<UserOutput>()
      .define(
        {
          id: () => faker.datatype.number(),
          _firstName: () => 'John',
          _lastName: () => 'Doe',
          fullName: ({ _firstName, _lastName }) => `${_firstName} ${_lastName}`,
          email: ({ _firstName, _lastName }) =>
            `${_firstName.toLowerCase()}.${_lastName.toLowerCase()}@example.com`,
          role: 'user',
        },
        { transientAttributes: ['_firstName', '_lastName'] }
      )
      .trait('admin', {
        _firstName: 'Admin',
        role: 'administrator',
      })
      .trait('manager', {
        _firstName: 'Jane',
        _lastName: 'Smith',
      });

    // Test with admin trait
    const admin = userFactory.build({ traits: ['admin'] });
    expect(admin.fullName).toBe('Admin Doe');
    expect(admin.email).toBe('admin.doe@example.com');
    expect(admin.role).toBe('administrator');
    expect(admin).not.toHaveProperty('_firstName');
    expect(admin).not.toHaveProperty('_lastName');

    // Test with manager trait
    const manager = userFactory.build({ traits: ['manager'] });
    expect(manager.fullName).toBe('Jane Smith');
    expect(manager.email).toBe('jane.smith@example.com');
    expect(manager).not.toHaveProperty('_firstName');
    expect(manager).not.toHaveProperty('_lastName');
  });

  it('supports overriding transient attributes', () => {
    const userFactory = createFactory<UserOutput>().define(
      {
        id: () => faker.datatype.number(),
        _firstName: () => 'John',
        _lastName: () => 'Doe',
        fullName: ({ _firstName, _lastName }) => `${_firstName} ${_lastName}`,
        email: ({ _firstName, _lastName }) =>
          `${_firstName.toLowerCase()}.${_lastName.toLowerCase()}@example.com`,
      },
      { transientAttributes: ['_firstName', '_lastName'] }
    );

    const user = userFactory.build({
      overrides: {
        _firstName: 'Alice',
        _lastName: 'Johnson',
      },
    });

    expect(user.fullName).toBe('Alice Johnson');
    expect(user.email).toBe('alice.johnson@example.com');
    expect(user).not.toHaveProperty('_firstName');
    expect(user).not.toHaveProperty('_lastName');
  });

  it('allows for complex derived values from transient attributes', () => {
    const userFactory = createFactory<UserOutput>().define(
      {
        id: () => faker.datatype.number(),
        _firstName: () => faker.name.firstName(),
        _lastName: () => faker.name.lastName(),
        _birthYear: () => 1990,
        _favoriteColors: () => ['blue', 'green'],
        fullName: ({ _firstName, _lastName }) => `${_firstName} ${_lastName}`,
        email: ({ _firstName, _lastName }) =>
          `${_firstName.toLowerCase()}.${_lastName.toLowerCase()}@example.com`,
        metadata: ({ _birthYear, _favoriteColors }) => ({
          age: new Date().getFullYear() - _birthYear,
          preferences: {
            colors: _favoriteColors,
            theme: _favoriteColors[0],
          },
        }),
      },
      {
        transientAttributes: [
          '_firstName',
          '_lastName',
          '_birthYear',
          '_favoriteColors',
        ],
      }
    );

    const user = userFactory.build();

    // Check that complex derived values work
    expect(user.metadata).toBeDefined();
    expect(user.metadata?.age).toBeGreaterThan(0);
    // Use type assertion to check the deeply nested properties
    const preferences = user.metadata?.preferences as
      | { colors: string[]; theme: string }
      | undefined;
    expect(preferences?.colors).toEqual(['blue', 'green']);
    expect(preferences?.theme).toBe('blue');

    // Check that no transient attributes are in the result
    expect(user).not.toHaveProperty('_firstName');
    expect(user).not.toHaveProperty('_lastName');
    expect(user).not.toHaveProperty('_birthYear');
    expect(user).not.toHaveProperty('_favoriteColors');
  });

  it('works with lifecycle hooks', () => {
    const userFactory = createFactory<UserOutput>()
      .define(
        {
          id: () => faker.datatype.number(),
          _firstName: () => 'John',
          _lastName: () => 'Doe',
          fullName: ({ _firstName, _lastName }) => `${_firstName} ${_lastName}`,
          email: ({ _firstName, _lastName }) =>
            `${_firstName.toLowerCase()}.${_lastName.toLowerCase()}@example.com`,
        },
        { transientAttributes: ['_firstName', '_lastName'] }
      )
      .beforeBuild((user, attributes) => {
        // Hooks should have access to transient attributes
        // Let's add a prefix to fullName based on _firstName
        const prefix = attributes._firstName.length > 4 ? 'Mr.' : 'Dr.';
        return {
          ...user,
          fullName: `${prefix} ${user.fullName}`,
          metadata: { originalFirstName: attributes._firstName },
        };
      })
      .afterBuild((user) => {
        // By this point, transient attributes should be gone
        return {
          ...user,
          role: user.fullName.includes('Dr.') ? 'Doctor' : 'Default',
        };
      });

    const user = userFactory.build();

    // Check that hooks modified data using transient attributes
    expect(user.fullName).toBe('Dr. John Doe');
    expect(user.role).toBe('Doctor');
    expect(user.metadata?.originalFirstName).toBe('John');

    // Check that transient attributes are not in final object
    expect(user).not.toHaveProperty('_firstName');
    expect(user).not.toHaveProperty('_lastName');
  });

  it('supports nested transient attributes', () => {
    // Create a separate factory for address
    const addressFactory = createFactory<AddressOutput>().define(
      {
        _streetNumber: () => '123',
        _streetName: () => 'Main St',
        street: ({ _streetNumber, _streetName }) =>
          `${_streetNumber} ${_streetName}`,
        city: () => 'Anytown',
        formattedAddress: ({ street, city }) => `${street}, ${city}`,
      },
      { transientAttributes: ['_streetNumber', '_streetName'] }
    );

    const userFactory = createFactory<UserWithAddress>().define(
      {
        id: () => faker.datatype.number(),
        _firstName: () => 'John',
        _lastName: () => 'Doe',
        fullName: ({ _firstName, _lastName }) => `${_firstName} ${_lastName}`,
        email: ({ _firstName, _lastName }) =>
          `${_firstName.toLowerCase()}.${_lastName.toLowerCase()}@example.com`,
        address: () => addressFactory.build(),
      },
      {
        transientAttributes: ['_firstName', '_lastName'],
      }
    );

    const user = userFactory.build();

    // Check top-level attributes
    expect(user.fullName).toBe('John Doe');
    expect(user.email).toBe('john.doe@example.com');

    // Check address with nested transient attributes
    expect(user.address.street).toBe('123 Main St');
    expect(user.address.city).toBe('Anytown');
    expect(user.address.formattedAddress).toBe('123 Main St, Anytown');

    // Verify transient attributes are gone at all levels
    expect(user).not.toHaveProperty('_firstName');
    expect(user).not.toHaveProperty('_lastName');
    expect(user.address).not.toHaveProperty('_streetNumber');
    expect(user.address).not.toHaveProperty('_streetName');

    // Verify the nested object shape
    expect(Object.keys(user.address).sort()).toEqual(
      ['city', 'formattedAddress', 'street'].sort()
    );
  });

  it('works with buildMany', () => {
    const userFactory = createFactory<UserOutput>().define(
      {
        id: () => faker.datatype.number(),
        _firstName: () => faker.name.firstName(),
        _lastName: () => faker.name.lastName(),
        fullName: ({ _firstName, _lastName }) => `${_firstName} ${_lastName}`,
        email: ({ _firstName, _lastName }) =>
          `${_firstName.toLowerCase()}.${_lastName.toLowerCase()}@example.com`,
      },
      { transientAttributes: ['_firstName', '_lastName'] }
    );

    const users = userFactory.buildMany(3);

    // Check that we have 3 users
    expect(users).toHaveLength(3);

    // Check that none of the users have transient attributes
    users.forEach((user) => {
      expect(user).not.toHaveProperty('_firstName');
      expect(user).not.toHaveProperty('_lastName');
      expect(Object.keys(user).sort()).toEqual(
        ['email', 'fullName', 'id'].sort()
      );

      // Each user should have fullName and email properly derived
      expect(user.fullName).toBeTruthy();
      expect(user.email).toContain('@example.com');
    });

    // Users should have different values
    expect(users[0].fullName).not.toBe(users[1].fullName);
    expect(users[1].fullName).not.toBe(users[2].fullName);
  });
});
