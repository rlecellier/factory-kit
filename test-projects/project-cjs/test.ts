import { faker } from '@faker-js/faker';
import { createFactory, sequence, unique } from 'factory-kit';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions?: string[];
}

describe('factory-kit with TypeScript', () => {
  describe('basic factory creation', () => {
    const userFactory = createFactory<User>().define({
      id: () => faker.string.uuid(),
      firstName: () => faker.person.firstName(),
      lastName: () => faker.person.lastName(),
      email: ({ firstName, lastName }) =>
        `${firstName}.${lastName}@example.com`,
      role: 'user',
    });

    it('should build a user with all required fields', () => {
      const user = userFactory.build();
      expect(user.id).toBeDefined();
      expect(user.firstName).toBeDefined();
      expect(user.lastName).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.email).toMatch(
        new RegExp(`^${user.firstName}.${user.lastName}@example.com$`)
      );
      expect(user.role).toBe('user');
    });
  });

  describe('traits', () => {
    const userWithTraits = createFactory<User>()
      .define({
        id: () => faker.string.uuid(),
        firstName: () => faker.person.firstName(),
        lastName: () => faker.person.lastName(),
        email: ({ firstName, lastName }) =>
          `${firstName}.${lastName}@example.com`,
        role: 'user',
        permissions: [],
      })
      .trait('admin', {
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
      })
      .trait('guest', {
        role: 'guest',
        permissions: ['read'],
      });

    it('should properly apply admin trait', () => {
      const admin = userWithTraits.build({ traits: ['admin'] });
      expect(admin.role).toBe('admin');
      expect(admin.permissions).toContain('read');
      expect(admin.permissions).toContain('write');
      expect(admin.permissions).toContain('delete');
    });

    it('should properly apply guest trait', () => {
      const guest = userWithTraits.build({ traits: ['guest'] });
      expect(guest.role).toBe('guest');
      expect(guest.permissions).toEqual(['read']);
    });
  });

  describe('overrides', () => {
    const userFactory = createFactory<User>().define({
      id: () => faker.string.uuid(),
      firstName: () => faker.person.firstName(),
      lastName: () => faker.person.lastName(),
      email: ({ firstName, lastName }) =>
        `${firstName}.${lastName}@example.com`,
      role: 'user',
    });

    it('should allow overriding default attributes', () => {
      const customUser = userFactory.build({
        overrides: {
          firstName: 'Custom',
          lastName: 'User',
          email: 'custom@example.org',
        },
      });

      expect(customUser.firstName).toBe('Custom');
      expect(customUser.lastName).toBe('User');
      expect(customUser.email).toBe('custom@example.org');
      expect(customUser.role).toBe('user'); // Not overriden
    });
  });

  describe('unique values', () => {
    interface UniqueItem {
      id: string;
      username: string;
    }

    const uniqueFactory = createFactory<UniqueItem>().define({
      id: unique(() => faker.string.uuid(), 'id'),
      username: unique(() => faker.internet.userName(), 'username'),
    });

    it('should generate unique values for multiple builds', () => {
      const unique1 = uniqueFactory.build();
      const unique2 = uniqueFactory.build();

      expect(unique1.id).not.toBe(unique2.id);
      expect(unique1.username).not.toBe(unique2.username);
    });
  });

  describe('sequences', () => {
    interface SequenceItem {
      id: number;
      code: string;
    }

    const sequenceFactory = createFactory<SequenceItem>().define({
      id: sequence((n) => n),
      code: sequence((n) => `CODE-${String(n).padStart(3, '0')}`),
    });

    it('should generate sequential values', () => {
      const seq1 = sequenceFactory.build();
      const seq2 = sequenceFactory.build();

      expect(seq2.id).toBe(seq1.id + 1);
      expect(seq2.code).toBe(`CODE-${String(seq1.id + 1).padStart(3, '0')}`);
    });
  });

  describe('buildMany', () => {
    const userFactory = createFactory<User>().define({
      id: () => faker.string.uuid(),
      firstName: () => faker.person.firstName(),
      lastName: () => faker.person.lastName(),
      email: ({ firstName, lastName }) =>
        `${firstName}.${lastName}@example.com`,
      role: 'user',
    });

    it('should build multiple objects', () => {
      const users = userFactory.buildMany(3);
      expect(users).toHaveLength(3);
      users.forEach((user) => {
        expect(user.id).toBeDefined();
        expect(user.firstName).toBeDefined();
        expect(user.lastName).toBeDefined();
        expect(user.email).toBeDefined();
      });
    });
  });
});
