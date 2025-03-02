// This is likely storing a map of factoryId -> fieldName -> values
const uniqueValueStores: Record<string, Record<string, Set<unknown>>> = {};
const DEFAULT_FACTORY_ID = 'default';
const DEFAULT_MAX_RETRIES = 100;

// Function to generate unique values
export function unique<T>(
  generator: () => T,
  fieldName: string,
  options: { factoryId?: string; maxRetries?: number } = {}
): () => T {
  const { factoryId = DEFAULT_FACTORY_ID, maxRetries = DEFAULT_MAX_RETRIES } =
    options;

  return () => {
    // Move initialization inside the returned function so it runs every time
    // Initialize factory store if needed
    if (!uniqueValueStores[factoryId]) {
      uniqueValueStores[factoryId] = {};
    }

    // Initialize field store if needed
    if (!uniqueValueStores[factoryId][fieldName]) {
      uniqueValueStores[factoryId][fieldName] = new Set();
    }

    const valueStore = uniqueValueStores[factoryId][fieldName];
    let value: T;
    let attempts = 0;

    do {
      value = generator();
      attempts++;

      // If the value is unique, add it to the store and return
      if (!valueStore.has(value)) {
        valueStore.add(value);
        return value;
      }
    } while (attempts < maxRetries);

    throw new Error(
      `Could not generate unique value for field '${fieldName}' after ${maxRetries} attempts`
    );
  };
}

// Clear unique values for a specific factory
export function clearUniqueStore(factoryId: string = DEFAULT_FACTORY_ID): void {
  if (uniqueValueStores[factoryId]) {
    // Replace with empty object instead of deleting
    uniqueValueStores[factoryId] = {};
  }
}

// Clear all unique values for all factories
export function clearAllUniqueStores(): void {
  // Reset the entire object instead of deleting individual properties
  Object.keys(uniqueValueStores).forEach((key) => {
    uniqueValueStores[key] = {};
  });
}
