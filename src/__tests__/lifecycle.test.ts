import { faker } from '@faker-js/faker';
import { createFactory } from '../factory';

describe('Factory lifecycle hooks', () => {
  // Define test interfaces
  interface User {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date | null;
    metadata?: Record<string, unknown>;
  }

  // Setup tracking variables for hooks execution
  let beforeBuildCalls: number;
  let afterBuildCalls: number;

  beforeEach(() => {
    // Reset tracking variables before each test
    beforeBuildCalls = 0;
    afterBuildCalls = 0;
  });

  test('beforeBuild hook modifies the object before it is finalized', () => {
    const fixedDate = new Date('2023-01-01');

    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        email: () => faker.internet.email(),
        createdAt: new Date(), // This will be a different date
        updatedAt: null,
      })
      .beforeBuild((user) => {
        // Modify the object
        user.createdAt = fixedDate;
        beforeBuildCalls++;
        return user;
      });

    const user = userFactory.build();

    expect(user.createdAt).toEqual(fixedDate);
    expect(beforeBuildCalls).toBe(1);
  });

  test('afterBuild hook is called after the object is built', () => {
    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        email: () => faker.internet.email(),
        createdAt: new Date(),
        updatedAt: null,
      })
      .afterBuild((user) => {
        // Perform side effect after object is built
        afterBuildCalls++;
        return user;
      });

    userFactory.build();

    expect(afterBuildCalls).toBe(1);
  });

  test('hooks are executed in the correct order', () => {
    const executionOrder: string[] = [];

    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        name: () => 'initial-name', // Start with a known name
        email: () => faker.internet.email(),
        createdAt: new Date(),
        updatedAt: null,
      })
      .beforeBuild((user) => {
        executionOrder.push('beforeBuild');
        user.name = `${user.name}-before-build`; // Modify name in beforeBuild
        return user;
      })
      .afterBuild((user) => {
        executionOrder.push('afterBuild');
        user.name = `${user.name}-after-build`; // Modify name in afterBuild
        return user;
      });

    const user = userFactory.build();

    expect(executionOrder).toEqual(['beforeBuild', 'afterBuild']);
    // Verify name shows the complete transformation chain
    expect(user.name).toBe('initial-name-before-build-after-build');
  });

  test('hooks support chaining multiple of the same type', () => {
    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        email: () => faker.internet.email(),
        createdAt: new Date(),
        updatedAt: null,
        metadata: {},
      })
      .beforeBuild((user) => {
        user.metadata = { ...user.metadata, step1: 'executed' };
        return user;
      })
      .beforeBuild((user) => {
        user.metadata = { ...user.metadata, step2: 'executed' };
        return user;
      })
      .afterBuild((user) => {
        user.metadata = { ...user.metadata, finalized: true };
        return user;
      });

    const user = userFactory.build();

    expect(user.metadata).toEqual({
      step1: 'executed',
      step2: 'executed',
      finalized: true,
    });
  });

  test('hooks work with buildMany', () => {
    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        email: () => faker.internet.email(),
        createdAt: new Date(),
        updatedAt: null,
      })
      .beforeBuild((user) => {
        beforeBuildCalls++;
        return user;
      })
      .afterBuild((user) => {
        afterBuildCalls++;
        return user;
      });

    userFactory.buildMany(3);

    expect(beforeBuildCalls).toBe(3);
    expect(afterBuildCalls).toBe(3);
  });

  test('hooks can access other attributes during execution', () => {
    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        email: () => faker.internet.email(),
        createdAt: new Date(),
        updatedAt: null,
      })
      .beforeBuild((user) => {
        // Set updatedAt based on createdAt
        user.updatedAt = new Date(user.createdAt);
        return user;
      });

    const user = userFactory.build();

    expect(user.updatedAt).toEqual(user.createdAt);
  });

  test('hooks can be used with traits', () => {
    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        email: () => faker.internet.email(),
        createdAt: new Date(),
        updatedAt: null,
        metadata: {},
      })
      .trait('admin', {
        metadata: { role: 'admin' },
      })
      .beforeBuild((user) => {
        if (user.metadata && user.metadata.role === 'admin') {
          user.email = 'admin@example.com';
        }

        return user;
      });

    const adminUser = userFactory.build({ traits: ['admin'] });
    const regularUser = userFactory.build();

    expect(adminUser.email).toBe('admin@example.com');
    expect(regularUser.email).not.toBe('admin@example.com');
  });

  test('hooks allow asynchronous operations', async () => {
    const asyncOperation = async (data: string): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`processed-${data}`), 10);
      });
    };

    const userFactory = createFactory<User>()
      .define({
        id: () => faker.datatype.number(),
        name: () => faker.name.fullName(),
        email: () => faker.internet.email(),
        createdAt: new Date(),
        updatedAt: null,
        metadata: {},
      })
      .beforeBuild(async (user) => {
        const processedName = await asyncOperation(user.name);
        user.metadata = { processedName };
        return user;
      });

    const user = await userFactory.buildAsync();

    expect(user.metadata?.processedName).toBe(`processed-${user.name}`);
  });
});
