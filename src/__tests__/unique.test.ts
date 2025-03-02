import { createFactory } from '@/factory';
import { clearAllUniqueStores, clearUniqueStore, unique } from '@/unique';
import { faker } from '@faker-js/faker';

describe('unique', () => {
  // Reset unique stores before each test
  beforeEach(() => {
    clearAllUniqueStores();
  });

  it('generates unique values', () => {
    // Create a generator that normally returns the same value each time
    const staticGenerator = () => 'same-value';

    // Wrap it with unique to make it return unique values
    const uniqueGenerator = unique(staticGenerator, 'test-field');

    // First call returns the original value
    expect(uniqueGenerator()).toBe('same-value');

    // Second call should throw because it can't generate a unique value
    expect(() => uniqueGenerator()).toThrow('Could not generate unique value');
  });

  it('works with different factory IDs', () => {
    // Create generators with the same field name but different factory IDs
    const generator = () => 'test-value';
    const uniqueGenerator1 = unique(generator, 'email', {
      factoryId: 'factory1',
    });
    const uniqueGenerator2 = unique(generator, 'email', {
      factoryId: 'factory2',
    });

    // Both should be able to use the same value because they have different context
    expect(uniqueGenerator1()).toBe('test-value');
    expect(uniqueGenerator2()).toBe('test-value');
  });

  it('clears unique store for specific factory', () => {
    const generator = () => 'test-value';
    const uniqueGenerator = unique(generator, 'test-field', {
      factoryId: 'factory1',
    });

    expect(uniqueGenerator()).toBe('test-value');

    // Clear store for factory1
    clearUniqueStore('factory1');

    // Should be able to reuse the value now
    expect(uniqueGenerator()).toBe('test-value');
  });

  it('clears all unique stores', () => {
    const generator = () => 'test-value';
    const uniqueGenerator1 = unique(generator, 'field', {
      factoryId: 'factory1',
    });
    const uniqueGenerator2 = unique(generator, 'field', {
      factoryId: 'factory2',
    });

    // Use up values
    uniqueGenerator1();
    uniqueGenerator2();

    // Clear all stores
    clearAllUniqueStores();

    // Should be able to reuse values
    expect(uniqueGenerator1()).toBe('test-value');
    expect(uniqueGenerator2()).toBe('test-value');
  });

  it('respects maxRetries option', () => {
    let counter = 0;
    const generator = () => {
      counter++;
      // Always return the same value to force retries
      return 'same-value';
    };

    const uniqueGenerator = unique(generator, 'field', { maxRetries: 5 });

    // First call succeeds
    uniqueGenerator();

    // Second call should throw after 5 attempts
    expect(() => uniqueGenerator()).toThrow();
    expect(counter).toBe(6); // Initial call + 5 retries
  });

  it('integrates with factory pattern', () => {
    interface User {
      id: string;
      email: string;
    }

    // Create a factory that generates users with unique emails
    const userFactory = createFactory<User>().define({
      id: () => faker.datatype.uuid(),
      email: unique(() => faker.internet.email().toLowerCase(), 'email'),
    });

    // Build multiple users
    const users = userFactory.buildMany(3);

    // All emails should be unique
    const emails = users.map((user) => user.email);
    const uniqueEmails = new Set(emails);

    expect(uniqueEmails.size).toBe(3);
  });

  it('handles uniqueness across multiple factory builds', () => {
    interface Product {
      sku: string;
      name: string;
    }

    // Use a counter to generate predictable values
    let counter = 0;
    const skuGenerator = () => `SKU-${counter++}`;

    const productFactory = createFactory<Product>().define({
      sku: unique(skuGenerator, 'sku'),
      name: () => faker.commerce.productName(),
    });

    // Build products one by one
    const product1 = productFactory.build();
    const product2 = productFactory.build();
    const product3 = productFactory.build();

    // Each should have a unique SKU
    expect(product1.sku).toBe('SKU-0');
    expect(product2.sku).toBe('SKU-1');
    expect(product3.sku).toBe('SKU-2');
  });
});
