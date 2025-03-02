/**
 * Sequence counter storage
 */
const counters = new Map<string, number>();

/**
 * Creates a factory function that generates a unique value using an incrementing counter
 *
 * @param callbackFn Function that receives the current sequence number and returns a value
 * @param options Configuration options
 * @returns Factory function that produces a unique value on each call
 */
export function sequence<T>(
  callbackFn: (n: number) => T,
  options: { id?: string; start?: number } = {}
): () => T {
  // Use a unique ID for this sequence or default to a random one if not provided
  const id = options.id ?? `seq_${Math.random().toString(36).substring(2, 9)}`;

  // Set the initial counter value if not already set
  if (!counters.has(id)) {
    counters.set(id, options.start ?? 1);
  }

  // Return a function that will increment and use the counter
  return function () {
    // Use fallback in the unlikely case the counter doesn't exist
    const currentValue = counters.get(id) ?? options.start ?? 1;
    counters.set(id, currentValue + 1);
    return callbackFn(currentValue);
  };
}

/**
 * Resets all sequence counters or a specific sequence counter
 *
 * @param id Optional sequence ID to reset. If not provided, all counters are reset.
 */
export function resetSequence(id?: string): void {
  if (id) {
    counters.delete(id);
  } else {
    counters.clear();
  }
}
