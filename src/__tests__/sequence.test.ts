import { resetSequence, sequence } from '../sequence';

describe('sequence', () => {
  // Reset all sequences before each test to ensure isolation
  beforeEach(() => {
    resetSequence();
  });

  test('generates incrementing numbers', () => {
    const nextNum = sequence((n) => n);
    expect(nextNum()).toBe(1);
    expect(nextNum()).toBe(2);
    expect(nextNum()).toBe(3);
  });

  test('transforms values using callback function', () => {
    const nextId = sequence((n) => `user-${n}`);
    expect(nextId()).toBe('user-1');
    expect(nextId()).toBe('user-2');
    expect(nextId()).toBe('user-3');
  });

  test('starts from custom starting value', () => {
    const nextNum = sequence((n) => n, { start: 100 });
    expect(nextNum()).toBe(100);
    expect(nextNum()).toBe(101);
  });

  test('maintains separate counters for different IDs', () => {
    const nextUserId = sequence((n) => `user-${n}`, { id: 'users' });
    const nextProductId = sequence((n) => `product-${n}`, { id: 'products' });

    expect(nextUserId()).toBe('user-1');
    expect(nextProductId()).toBe('product-1');
    expect(nextUserId()).toBe('user-2');
    expect(nextProductId()).toBe('product-2');
  });

  test('auto-generates unique IDs for sequences', () => {
    const seq1 = sequence((n) => n);
    const seq2 = sequence((n) => n);

    expect(seq1()).toBe(1);
    expect(seq1()).toBe(2);
    expect(seq2()).toBe(1);
    expect(seq2()).toBe(2);
  });

  test('resets specific sequence by ID', () => {
    const nextUserId = sequence((n) => `user-${n}`, { id: 'users' });
    const nextProductId = sequence((n) => `product-${n}`, { id: 'products' });

    expect(nextUserId()).toBe('user-1');
    expect(nextProductId()).toBe('product-1');

    resetSequence('users');

    expect(nextUserId()).toBe('user-1'); // Restarted
    expect(nextProductId()).toBe('product-2'); // Continues
  });

  test('resets all sequences when no ID provided', () => {
    const nextUserId = sequence((n) => `user-${n}`, { id: 'users' });
    const nextProductId = sequence((n) => `product-${n}`, { id: 'products' });

    expect(nextUserId()).toBe('user-1');
    expect(nextProductId()).toBe('product-1');

    resetSequence();

    expect(nextUserId()).toBe('user-1'); // Restarted
    expect(nextProductId()).toBe('product-1'); // Restarted
  });

  test('restarts with custom start value after reset', () => {
    const nextNum = sequence((n) => n, { id: 'counter', start: 100 });
    expect(nextNum()).toBe(100);
    expect(nextNum()).toBe(101);

    resetSequence('counter');

    expect(nextNum()).toBe(100); // Reset to start value
  });
});
