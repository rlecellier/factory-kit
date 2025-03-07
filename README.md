# Factory-Kit

## Disclaimer

This library was inspired by a need I encountered repeatedly throughout my years of professional work. Creating consistent, type-safe test data has been a challenge I've faced across multiple projects and organizations.

I initially started a lightweight version of this concept while working at Open Fun (https://github.com/openfun) to address specific testing needs there. This current iteration represents a more comprehensive solution to the problem.

Worth mentioning: this version was developed through extensive pair programming with GitHub Copilot (what some might call "vibe coding" these days). The collaborative process between human intention and AI assistance helped shape both the implementation and documentation.

A TypeScript library implementing the factory pattern for creating test data with Faker.js, inspired by Python's FactoryBoy.

## Introduction

Factory-Kit helps you create realistic test data for your TypeScript. It provides a clean, fluent API for defining factories that generate consistent test objects with minimal setup.

Whether you're writing unit tests, integration tests, or creating demo applications, Factory-Kit simplifies the process of generating test data that looks and behaves like real-world data.

## Table of Contents

- [Installation](#installation)
- [Why Factory-Kit?](#why-factory-kit)
- [Basic Usage](#basic-usage)
  - [Creating a Factory](#creating-a-factory)
  - [Building Objects](#building-objects)
- [Advanced Features](#advanced-features)
  - [Using Traits](#using-traits)
  - [Overriding Attributes](#overriding-attributes)
  - [Unique Values](#unique-values)
  - [Sequences](#sequences)
  - [Dependent Attributes](#dependent-attributes)
  - [Related Factories](#related-factories)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
  - [Missing Features](#missing-features)
- [Example Projects](#example-projects)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install factory-kit @faker-js/faker
# or
yarn add factory-kit @faker-js/faker
```

## Why Factory-Kit?

- **DRY Test Data**: Define your test data structures once and reuse them across your test suite
- **Type Safety**: Full TypeScript support ensures your factories produce objects that match your interfaces
- **Realistic Data**: Leverage Faker.js to generate realistic names, emails, dates, and more
- **Composable**: Combine factories to create complex, related object structures

## Basic Usage

### Creating a Factory

You can define factory attributes in two ways:

#### Method 1: Using direct faker functions

This is the simplest approach where you provide static values or direct faker function calls:

```typescript
import { createFactory } from 'factory-kit';
import { faker } from '@faker-js/faker';

interface Profile {
  bio: string;
  avatar: string;
  createdAt: Date;
}

const profileFactory = createFactory<Profile>().define({
  bio: faker.lorem.paragraph(), // Direct faker function call
  avatar: faker.image.avatar(), // Direct faker function call
  createdAt: new Date(), // Static value
});
```

#### Method 2: Using attribute functions with dependencies

This approach gives you access to other attributes of the instance being built, allowing you to create dependent attributes:

```typescript
import { createFactory } from 'factory-kit';
import { faker } from '@faker-js/faker';

// Define your model interface
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

// Create a factory
const userFactory = createFactory<User>().define({
  id: () => faker.datatype.number(), // Function that generates a new value each time
  firstName: () => faker.name.firstName(),
  lastName: () => faker.name.lastName(),
  // Email depends on firstName and lastName attributes
  email: ({ firstName, lastName }) =>
    `${firstName}.${lastName}@example.com`.toLowerCase(),
  isAdmin: false, // Static value
});
```

You can mix both approaches within the same factory definition.

### Building Objects

```typescript
// Build a single instance
const user = userFactory.build();
console.log(user);
// Output: { id: 42, firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com', isAdmin: false }

// Build multiple instances
const users = userFactory.buildMany(3);
console.log(users.length); // 3
```

## Advanced Features

### Using Traits

Traits allow you to define variations of your factory:

```typescript
const userFactory = createFactory<User>()
  .define({
    id: () => faker.datatype.number(), // Function that generates a new value each time
    firstName: () => faker.name.firstName(),
    lastName: () => faker.name.lastName(),
    email: (
      { firstName, lastName } // Dependent attribute function
    ) => `${firstName}.${lastName}@example.com`.toLowerCase(),
    isAdmin: false, // Static value
  })
  .trait('admin', {
    isAdmin: true,
  })
  .trait('withCustomEmail', {
    email: 'custom@example.org', // Static value
  });

// Build a user with the admin trait
const adminUser = userFactory.build({ traits: ['admin'] });
console.log(adminUser.isAdmin); // true

// Apply multiple traits
const user = userFactory.build({ traits: ['admin', 'withCustomEmail'] });
console.log(user.isAdmin); // true
console.log(user.email); // custom@example.org
```

### Overriding Attributes

You can override specific attributes when building:

```typescript
const user = userFactory.build({
  overrides: {
    firstName: 'John',
    lastName: 'Doe',
  },
});

console.log(user.firstName); // John
console.log(user.lastName); // Doe
```

#### Nested Overrides

You can override attributes in nested objects using the double underscore (`__`) syntax:

```typescript
const preferencesFactory = createFactory<Preferences>().define({
  theme: 'light',
  notifications: true,
});

const profileFactory = createFactory<Profile>().define({
  bio: faker.lorem.paragraph(),
  avatar: faker.image.avatar(),
  preferences: () => preferencesFactory.build(),
});

const userFactory = createFactory<User>().define({
  id: () => faker.datatype.number(),
  name: () => faker.name.fullName(),
  profile: () => profileFactory.build(),
});

// Override nested properties
const user = userFactory.build({
  overrides: {
    name: 'John Doe',
    profile__bio: 'Custom bio', // Override bio in the profile object
    profile__avatar: () => faker.image.avatar(), // Override with a function
    profile__preferences__theme: 'dark', // Override theme in the preferences object inside profile
  },
});

console.log(user.name); // John Doe
console.log(user.profile.bio); // Custom bio
console.log(user.profile.preferences.theme); // dark
```

### Unique Values

Ensure that generated values are unique across factory invocations, which is essential for fields like emails, usernames, or UUIDs:

```typescript
import { createFactory, unique } from 'factory-kit';
import { faker } from '@faker-js/faker';

interface User {
  id: string;
  email: string;
  username: string;
}

const userFactory = createFactory<User>().define({
  id: unique(() => faker.datatype.uuid(), 'id'),
  email: unique(() => faker.internet.email().toLowerCase(), 'email'),
  username: unique(() => faker.internet.userName(), 'username'),
});

// Each user will have a unique ID, email, and username
const users = userFactory.buildMany(5);
```

#### Scoping Uniqueness

You can scope uniqueness to different factory contexts:

```typescript
const adminFactory = createFactory<User>().define({
  id: unique(() => faker.datatype.uuid(), 'id', { factoryId: 'admin' }),
  email: unique(() => faker.internet.email().toLowerCase(), 'email', {
    factoryId: 'admin',
  }),
  username: unique(() => faker.internet.userName(), 'username', {
    factoryId: 'admin',
  }),
});

const regularUserFactory = createFactory<User>().define({
  id: unique(() => faker.datatype.uuid(), 'id', { factoryId: 'regular' }),
  email: unique(() => faker.internet.email().toLowerCase(), 'email', {
    factoryId: 'regular',
  }),
  username: unique(() => faker.internet.userName(), 'username', {
    factoryId: 'regular',
  }),
});

// Users from different factories can have the same values
// because uniqueness is scoped by factoryId
```

#### Handling Uniqueness Exhaustion

Configure how many retries should be attempted before giving up:

```typescript
// Will try up to 200 times to generate a unique value before throwing an error
const emailGenerator = unique(
  () => faker.internet.email().toLowerCase(),
  'email',
  { maxRetries: 200 }
);
```

#### Clearing Unique Value Stores

Clean up stored unique values between test runs:

```typescript
import { clearUniqueStore, clearAllUniqueStores } from 'factory-kit';

// Clear unique values for a specific factory
clearUniqueStore('admin');

// Clear all unique value stores across all factories
clearAllUniqueStores();
```

This is particularly useful in test setups to ensure test isolation.

### Sequences

Generate sequential values with incrementing counters:

```typescript
import { createFactory, sequence } from 'factory-kit';

interface User {
  id: number;
  username: string;
}

const userFactory = createFactory<User>().define({
  // Simple number sequence that increments by 1
  id: sequence((n) => n),
  // Use the sequence value in a formatted string
  username: sequence((n) => `user_${n}`),
});

const users = userFactory.buildMany(3);
// Results in:
// [
//   { id: 1, username: 'user_1' },
//   { id: 2, username: 'user_2' },
//   { id: 3, username: 'user_3' }
// ]
```

#### Configuring Sequences

You can configure sequences with a custom starting point and identifier:

```typescript
import { createFactory, sequence } from 'factory-kit';

const userFactory = createFactory<User>().define({
  // Start from 1000
  id: sequence((n) => n, { start: 1000, id: 'userId' }),
  // This sequence uses a different counter
  code: sequence((n) => `CODE-${n.toString().padStart(3, '0')}`, {
    id: 'userCode',
    start: 1,
  }),
});

const users = userFactory.buildMany(3);
// Results in:
// [
//   { id: 1000, code: 'CODE-001' },
//   { id: 1001, code: 'CODE-002' },
//   { id: 1002, code: 'CODE-003' }
// ]
```

#### Resetting Sequences

Reset sequences between test runs to ensure consistent starting values:

```typescript
import { resetSequence } from 'factory-kit';

// Reset a specific sequence by ID
resetSequence('userId');

// Reset all sequences
resetSequence();
```

### Dependent Attributes

Attributes can depend on other attributes:

```typescript
const userFactory = createFactory<User>().define({
  firstName: () => faker.name.firstName(),
  lastName: () => faker.name.lastName(),
  // Email depends on firstName and lastName
  email: ({ firstName, lastName }) =>
    `${firstName}.${lastName}@example.com`.toLowerCase(),
  // Username depends on firstName
  username: ({ firstName }) => `${firstName.toLowerCase()}_user`,
});

const user = userFactory.build();
// The email will be based on the generated firstName and lastName
// The username will be based on just the firstName
```

### Related Factories

You can use one factory inside another to create related objects:

```typescript
interface Profile {
  bio: string;
  avatar: string;
}

interface User {
  id: number;
  name: string;
  profile: Profile;
}

// Create a factory for profiles with direct faker function calls
const profileFactory = createFactory<Profile>().define({
  bio: faker.lorem.paragraph(),
  avatar: faker.image.avatar(),
});

// Use the profile factory inside the user factory
const userFactory = createFactory<User>().define({
  id: () => faker.datatype.number(),
  name: () => faker.name.fullName(),
  profile: () => profileFactory.build(), // Use a function to create a new profile each time
});

const user = userFactory.build();
console.log(user.profile); // Contains a generated profile
```

## API Reference

### createFactory<T>()

Creates a new factory for building objects of type T.

**Returns:** Factory<T>

### Factory<T>

#### define(attributes: AttributesFor<T>): Factory<T>

Defines the default attributes for the factory.

- `attributes`: An object where keys are attribute names and values are either static values or functions that return values.

**Returns:** The factory instance for chaining

#### trait(name: string, attributes: AttributesFor<T>): Factory<T>

Defines a trait that can be applied when building objects.

- `name`: The name of the trait.
- `attributes`: An object containing attribute overrides for this trait.

**Returns:** The factory instance for chaining

#### build(options?: BuildOptions<T>): T

Builds a single object with the defined attributes.

- `options.traits`: An array of trait names to apply.
- `options.overrides`: An object with attribute values to override. Supports nested overrides using `_` and `__` syntax.

**Returns:** An instance of type T

#### buildMany(count: number, options?: BuildOptions<T>): T[]

Builds multiple objects with the defined attributes.

- `count`: The number of objects to build.
- `options`: Same as for `build()`.

**Returns:** An array of instances of type T

## Roadmap

The following features are planned for future releases:

### Missing Features

- **Lifecycle Hooks** - Before/after build hooks for setup or cleanup operations

  ```typescript
  import { createFactory } from 'factory-kit';

  const userFactory = createFactory<User>()
    .define({
      id: () => faker.datatype.number(),
      name: () => faker.name.fullName(),
      createdAt: new Date(),
    })
    .beforeBuild((user) => {
      // Modify the object before it's finalized
      user.createdAt = new Date('2023-01-01');
      return user;
    })
    .afterBuild((user) => {
      // Perform operations after object is built
      console.log(`Built user: ${user.name}`);
      return user;
    });

  // Hooks will run during build process
  const user = userFactory.build();
  ```

- **Inheritance** - Factory inheritance to create specialized factories from base factories

  ```typescript
  import { createFactory } from 'factory-kit';

  // Base person factory
  const personFactory = createFactory<Person>().define({
    name: () => faker.name.fullName(),
    email: () => faker.internet.email(),
    age: () => faker.datatype.number({ min: 18, max: 65 }),
  });

  // Employee extends Person with additional attributes
  const employeeFactory = personFactory.extend<Employee>().define({
    employeeId: () => faker.datatype.number(),
    department: () => faker.commerce.department(),
    hireDate: () => faker.date.past(),
  });

  // Manager extends Employee with additional attributes
  const managerFactory = employeeFactory.extend<Manager>().define({
    subordinates: () => [],
    level: 'middle',
  });

  const manager = managerFactory.build();
  // Contains all attributes from Person, Employee, and Manager
  ```

- **Transient Attributes** - Attributes used during building but not included in the final object

  ```typescript
  import { createFactory } from 'factory-kit';

  interface UserOutput {
    id: number;
    fullName: string;
    email: string;
  }

  const userFactory = createFactory<UserOutput>().define(
    {
      id: () => faker.datatype.number(),
      // Transient attributes - used during building but excluded from result
      _firstName: () => faker.name.firstName(),
      _lastName: () => faker.name.lastName(),
      // Use transient attributes in computed values
      fullName: ({ _firstName, _lastName }) => `${_firstName} ${_lastName}`,
      email: ({ _firstName, _lastName }) =>
        `${_firstName}.${_lastName}@example.com`.toLowerCase(),
    },
    {
      transientAttributes: ['_firstName', '_lastName'],
    }
  );

  const user = userFactory.build();
  // Result: { id: 123, fullName: 'Jane Doe', email: 'jane.doe@example.com' }
  // _firstName and _lastName are not included in the final object
  ```

- **Persistence Integration** - Direct integration with ORMs to save created objects

  ```typescript
  import { createFactory } from 'factory-kit';
  import { UserModel } from './my-orm-models';

  const userFactory = createFactory<User>()
    .define({
      name: () => faker.name.fullName(),
      email: () => faker.internet.email(),
    })
    .adapter({
      // Define how to persist the object
      save: async (attributes) => {
        const user = new UserModel(attributes);
        await user.save();
        return user;
      },
    });

  // Create AND persist a user to the database
  const savedUser = await userFactory.create();

  // Create multiple persisted users
  const savedUsers = await userFactory.createMany(3);
  ```

- **Batch Customization** - Ways to customize individual objects in a buildMany operation

  ```typescript
  import { createFactory } from 'factory-kit';

  const userFactory = createFactory<User>().define({
    id: () => faker.datatype.number(),
    name: () => faker.name.fullName(),
    role: 'user',
  });

  // Build many with individual customizations
  const users = userFactory.buildMany(3, {
    customize: [
      // First user gets these overrides
      { name: 'Admin User', role: 'admin' },
      // Second user gets these overrides
      { role: 'moderator' },
      // Third user uses default attributes (no overrides provided)
    ],
  });

  // Result:
  // [
  //   { id: 123, name: 'Admin User', role: 'admin' },
  //   { id: 456, name: 'Jane Doe', role: 'moderator' },
  //   { id: 789, name: 'John Smith', role: 'user' }
  // ]
  ```

- **Seeding** - Ability to set a specific seed for reproducible test data generation

  ```typescript
  import { createFactory, setSeed } from 'factory-kit';

  // Set a global seed for all factories
  setSeed('consistent-test-data-seed');

  const userFactory = createFactory<User>().define({
    id: () => faker.datatype.number(),
    name: () => faker.name.fullName(),
    email: () => faker.internet.email(),
  });

  // These will produce the same data every time with the same seed
  const user1 = userFactory.build();

  // Reset and use a different seed for a different test suite
  setSeed('another-test-suite-seed');
  const user2 = userFactory.build(); // Different from user1

  // Can also set seed for specific factory instances
  const productFactory = createFactory<Product>()
    .define({
      /* attributes */
    })
    .seed('product-specific-seed');
  ```

Adding these would make your factory library more comprehensive for complex testing scenarios.

## Example Projects

- **Unit Testing**: Generate consistent test data for your unit tests
- **Storybook**: Create realistic props for your component stories
- **Demo Applications**: Populate your demo apps with realistic data
- **Development**: Use while developing to simulate API responses

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
