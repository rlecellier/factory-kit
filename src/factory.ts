import type { AttributesFor, BuildOptions, Factory } from '@/types';
import { faker } from '@faker-js/faker';

/**
 * Creates a factory for generating objects of type T.
 *
 * @template T The type of objects this factory will create
 * @returns A new factory instance
 */
export function createFactory<T>(): Factory<T> {
  const attributes: AttributesFor<T> = {} as AttributesFor<T>;
  const traits: Record<string, AttributesFor<T>> = {};

  // Process nested overrides with double underscore notation (profile__name, profile__settings__theme)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyNestedOverrides = (obj: any, key: string, value: any): void => {
    if (key.includes('__')) {
      // Split the key by double underscores
      const parts = key.split('__');

      // The first part is the top-level property
      const topLevelKey = parts[0];

      // Ensure the top-level object exists
      if (!obj[topLevelKey]) obj[topLevelKey] = {};

      let currentObj = obj[topLevelKey];

      // Process all nested paths except the last one
      for (let i = 1; i < parts.length - 1; i++) {
        const nestedKey = parts[i];
        if (!currentObj[nestedKey]) currentObj[nestedKey] = {};
        currentObj = currentObj[nestedKey];
      }

      // Set the value on the deepest property
      const lastKey = parts[parts.length - 1];
      currentObj[lastKey] = typeof value === 'function' ? value() : value;
    } else {
      // Direct property (no nesting)
      obj[key] = typeof value === 'function' ? value() : value;
    }
  };

  // Helper to detect if a function is a direct faker call vs an attribute function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isFakerDirectCall = (fn: any): boolean => {
    return fn.length === 0; // Attribute functions take 2 parameters (instance, faker)
  };

  // Builds a single instance of T
  const buildInstance = (options: BuildOptions<T> = {}): T => {
    const instance = {} as T;
    const attributeKeys = Object.keys(attributes);

    // First pass: Apply all static values and direct faker calls
    for (const key of attributeKeys) {
      const value = attributes[key as keyof T];

      // Skip attribute functions that depend on other attributes
      if (typeof value === 'function' && !isFakerDirectCall(value)) {
        continue;
      } else if (typeof value === 'function') {
        // For direct faker function calls
        instance[key as keyof T] = value() as T[keyof T];
      } else {
        // For static values
        instance[key as keyof T] = value as T[keyof T];
      }
    }

    // Second pass: Apply attribute functions that depend on other attributes
    for (const key of attributeKeys) {
      const value = attributes[key as keyof T];

      if (typeof value === 'function' && !isFakerDirectCall(value)) {
        // For attribute functions that require instance and faker
        instance[key as keyof T] = value(instance, faker) as T[keyof T];
      }
    }

    // Apply traits if specified
    if (options.traits) {
      for (const traitName of options.traits) {
        const trait = traits[traitName];
        if (trait) {
          // First pass for traits: static values and direct faker calls
          for (const [key, value] of Object.entries(trait)) {
            if (typeof value === 'function' && !isFakerDirectCall(value)) {
              continue;
            } else if (typeof value === 'function') {
              instance[key as keyof T] = value() as T[keyof T];
            } else {
              instance[key as keyof T] = value as T[keyof T];
            }
          }

          // Second pass for traits: attribute functions
          for (const [key, value] of Object.entries(trait)) {
            if (typeof value === 'function' && !isFakerDirectCall(value)) {
              instance[key as keyof T] = value(instance, faker) as T[keyof T];
            }
          }
        }
      }
    }

    // Apply overrides if specified
    if (options.overrides) {
      for (const [key, value] of Object.entries(options.overrides)) {
        applyNestedOverrides(instance, key, value);
      }
    }

    return instance;
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const factory: Factory<T> & Record<string, Function> = {
    define: (newAttributes) => {
      Object.assign(attributes, newAttributes);
      return factory;
    },

    trait: (name, traitAttributes) => {
      traits[name] = traitAttributes;
      return factory;
    },

    build: (options = {}) => {
      return buildInstance(options);
    },

    buildMany: (count, options = {}) => {
      const results: T[] = [];
      for (let i = 0; i < count; i++) {
        results.push(buildInstance(options));
      }

      return results;
    },
  };

  return factory;
}
