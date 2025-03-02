import { createFactory } from '@/factory';
import { faker } from '@faker-js/faker';

// Test interface
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}

describe('createFactory', () => {
  it('builds an object with default attributes', () => {
    const userFactory = createFactory<User>().define({
      id: () => faker.datatype.number(),
      firstName: () => faker.name.firstName(),
      lastName: () => faker.name.lastName(),
      // Now we can safely use firstName and lastName without non-null assertions
      // because our factory implementation guarantees they are set before this runs
      email: ({ firstName, lastName }) =>
        `${firstName}.${lastName}@example.com`.toLowerCase(),
      isAdmin: false,
      createdAt: new Date('2023-01-01'),
    });

    const user = userFactory.build();

    expect(user.id).toEqual(expect.any(Number));
    expect(user.firstName).toEqual(expect.any(String));
    expect(user.lastName).toEqual(expect.any(String));
    expect(user.email).toEqual(expect.stringContaining('@example.com'));
    expect(user.isAdmin).toBe(false);
    expect(user.createdAt).toEqual(new Date('2023-01-01'));
  });

  // Add new test for direct faker function usage
  it('supports direct faker function usage', () => {
    interface Profile {
      bio: string;
      avatar: string;
      createdAt: Date;
    }

    const profileFactory = createFactory<Profile>().define({
      bio: faker.lorem.paragraph(),
      avatar: faker.image.avatar(),
      createdAt: new Date('2023-01-01'),
    });

    const profile = profileFactory.build();

    expect(profile.bio).toEqual(expect.any(String));
    expect(profile.avatar).toEqual(expect.any(String));
    expect(profile.createdAt).toEqual(new Date('2023-01-01'));
  });

  it('applies trait overrides', () => {
    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        firstName: () => faker.name.firstName(),
        lastName: () => faker.name.lastName(),
        email: ({ firstName, lastName }) =>
          `${firstName}.${lastName}@example.com`.toLowerCase(),
        isAdmin: false,
        createdAt: new Date('2023-01-01'),
      })
      .trait('admin', {
        isAdmin: true,
      });

    const user = userFactory.build({ traits: ['admin'] });

    expect(user.isAdmin).toBe(true);
  });

  it('builds many instances', () => {
    const userFactory = createFactory<User>().define({
      id: () => faker.datatype.number(),
      firstName: () => faker.name.firstName(),
      lastName: () => faker.name.lastName(),
      email: () => faker.internet.email(),
      isAdmin: false,
      createdAt: new Date('2023-01-01'),
    });

    const users = userFactory.buildMany(3);

    expect(users).toHaveLength(3);
    expect(users[0].id).not.toEqual(users[1].id);
    expect(users[0].email).not.toEqual(users[1].email);
  });

  it('accepts manual overrides', () => {
    const userFactory = createFactory<User>().define({
      id: () => faker.datatype.number(),
      firstName: () => faker.name.firstName(),
      lastName: () => faker.name.lastName(),
      email: () => faker.internet.email(),
      isAdmin: false,
      createdAt: new Date('2023-01-01'),
    });

    const user = userFactory.build({
      overrides: {
        firstName: 'Custom',
        lastName: 'Name',
      },
    });

    expect(user.firstName).toBe('Custom');
    expect(user.lastName).toBe('Name');
  });

  // New tests for nested overrides
  describe('nested overrides', () => {
    // Define interfaces for nested structures
    interface Preferences {
      theme: string;
      notifications: boolean;
      darkMode: boolean; // camelCase property
      color_scheme: string; // snake_case property
    }

    interface Profile {
      bio: string;
      avatar: string;
      preferences: Preferences;
      lastUpdated: Date; // camelCase property
      social_links: { twitter: string; github: string }; // snake_case property
    }

    interface CompleteUser {
      id: number;
      name: string;
      profile: Profile;
      metaData: { createdBy: string; tags: string[] }; // camelCase property
      access_details: { role: string; permissions: string[] }; // snake_case property
    }

    it('overrides nested attributes using double underscore syntax', () => {
      // Create factories for nested structures
      const profileFactory = createFactory<Profile>().define({
        bio: faker.lorem.paragraph(),
        avatar: faker.image.avatar(),
        preferences: {
          theme: 'light',
          notifications: true,
          darkMode: false,
          color_scheme: 'blue',
        },
        lastUpdated: new Date('2023-01-01'),
        social_links: { twitter: '@default', github: 'default' },
      });

      const userFactory = createFactory<CompleteUser>().define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        profile: () => profileFactory.build(),
        metaData: { createdBy: 'system', tags: ['default'] },
        access_details: { role: 'user', permissions: ['read'] },
      });

      // Test direct nested properties using __ syntax
      const user = userFactory.build({
        overrides: {
          name: 'John Smith',
          profile__bio: 'Custom bio',
          profile__avatar: 'custom-avatar.jpg',
        },
      });

      // Verify overrides were applied correctly
      expect(user.name).toBe('John Smith');
      expect(user.profile.bio).toBe('Custom bio');
      expect(user.profile.avatar).toBe('custom-avatar.jpg');
      expect(user.profile.preferences.theme).toBe('light'); // unchanged
    });

    it('overrides deeply nested attributes using multiple double underscores', () => {
      // Create factories for nested structures
      const preferencesFactory = createFactory<Preferences>().define({
        theme: 'light',
        notifications: true,
        darkMode: false,
        color_scheme: 'blue',
      });

      const profileFactory = createFactory<Profile>().define({
        bio: faker.lorem.paragraph(),
        avatar: faker.image.avatar(),
        preferences: () => preferencesFactory.build(),
        lastUpdated: new Date('2023-01-01'),
        social_links: { twitter: '@default', github: 'default' },
      });

      const userFactory = createFactory<CompleteUser>().define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        profile: () => profileFactory.build(),
        metaData: { createdBy: 'system', tags: ['default'] },
        access_details: { role: 'user', permissions: ['read'] },
      });

      // Test deep nesting override using multiple __ syntax
      const user = userFactory.build({
        overrides: {
          name: 'John Doe',
          profile__bio: 'Custom bio',
          profile__preferences__theme: 'dark',
          profile__preferences__notifications: false,
        },
      });

      // Verify deep overrides were applied correctly
      expect(user.name).toBe('John Doe');
      expect(user.profile.bio).toBe('Custom bio');
      expect(user.profile.preferences.theme).toBe('dark');
      expect(user.profile.preferences.notifications).toBe(false);
    });

    it('supports camelCase property overrides', () => {
      const userFactory = createFactory<CompleteUser>().define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        profile: {
          bio: 'Default bio',
          avatar: 'default.jpg',
          preferences: {
            theme: 'light',
            notifications: true,
            darkMode: false,
            color_scheme: 'blue',
          },
          lastUpdated: new Date('2023-01-01'),
          social_links: { twitter: '@default', github: 'default' },
        },
        metaData: { createdBy: 'system', tags: ['default'] },
        access_details: { role: 'user', permissions: ['read'] },
      });

      const user = userFactory.build({
        overrides: {
          profile__lastUpdated: new Date('2023-02-01'),
          profile__preferences__darkMode: true,
          metaData__createdBy: 'admin',
          metaData__tags: ['important', 'featured'],
        },
      });

      expect(user.profile.lastUpdated).toEqual(new Date('2023-02-01'));
      expect(user.profile.preferences.darkMode).toBe(true);
      expect(user.metaData.createdBy).toBe('admin');
      expect(user.metaData.tags).toEqual(['important', 'featured']);
    });

    it('supports snake_case property overrides', () => {
      const userFactory = createFactory<CompleteUser>().define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        profile: {
          bio: 'Default bio',
          avatar: 'default.jpg',
          preferences: {
            theme: 'light',
            notifications: true,
            darkMode: false,
            color_scheme: 'blue',
          },
          lastUpdated: new Date('2023-01-01'),
          social_links: { twitter: '@default', github: 'default' },
        },
        metaData: { createdBy: 'system', tags: ['default'] },
        access_details: { role: 'user', permissions: ['read'] },
      });

      const user = userFactory.build({
        overrides: {
          profile__social_links__twitter: '@johndoe',
          profile__preferences__color_scheme: 'dark-blue',
          access_details__role: 'admin',
          access_details__permissions: ['read', 'write', 'delete'],
        },
      });

      expect(user.profile.social_links.twitter).toBe('@johndoe');
      expect(user.profile.preferences.color_scheme).toBe('dark-blue');
      expect(user.access_details.role).toBe('admin');
      expect(user.access_details.permissions).toEqual([
        'read',
        'write',
        'delete',
      ]);
    });

    it('supports function overrides in nested properties', () => {
      const profileFactory = createFactory<Profile>().define({
        bio: faker.lorem.paragraph(),
        avatar: faker.image.avatar(),
        preferences: {
          theme: 'light',
          notifications: true,
          darkMode: false,
          color_scheme: 'blue',
        },
        lastUpdated: new Date('2023-01-01'),
        social_links: { twitter: '@default', github: 'default' },
      });

      const userFactory = createFactory<CompleteUser>().define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        profile: () => profileFactory.build(),
        metaData: { createdBy: 'system', tags: ['default'] },
        access_details: { role: 'user', permissions: ['read'] },
      });

      // Custom function for generating a bio
      const customBioFn = () => 'Function generated bio';

      // Test function override in nested property
      const user = userFactory.build({
        overrides: {
          profile__bio: customBioFn,
        },
      });

      // Verify function override was applied and executed
      expect(user.profile.bio).toBe('Function generated bio');
    });

    it('works with sub-factories in overrides', () => {
      interface Address {
        street: string;
        city: string;
        zipCode: string;
      }

      interface Contact {
        email: string;
        phone: string;
        address: Address;
      }

      interface Customer {
        id: number;
        name: string;
        contact: Contact;
      }

      // Create address factory
      const addressFactory = createFactory<Address>().define({
        street: () => faker.address.streetAddress(),
        city: () => faker.address.city(),
        zipCode: () => faker.address.zipCode(),
      });

      // Create contact factory that uses address factory
      const contactFactory = createFactory<Contact>().define({
        email: () => faker.internet.email(),
        phone: () => faker.phone.number(),
        address: () => addressFactory.build(),
      });

      // Create customer factory that uses contact factory
      const customerFactory = createFactory<Customer>().define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        contact: () => contactFactory.build(),
      });

      // Create a new address to use in the override
      const newAddress = addressFactory.build({
        overrides: {
          street: '123 Main St',
          city: 'New York',
        },
      });

      // Override with a sub-factory result
      const customer = customerFactory.build({
        overrides: {
          name: 'Jane Smith',
          contact__address: newAddress,
        },
      });

      expect(customer.name).toBe('Jane Smith');
      expect(customer.contact.address).toEqual(newAddress);
      expect(customer.contact.address.street).toBe('123 Main St');
      expect(customer.contact.address.city).toBe('New York');
    });
  });
});
