import type {
  AttributesFor,
  BuildOptions,
  Factory,
  LifecycleHook,
  WithTransientAttributes,
} from '@/types';
import { faker } from '@faker-js/faker';

/**
 * Creates a factory for generating objects of type T.
 *
 * @template T The type of objects this factory will create
 * @returns A new factory instance
 */
export function createFactory<T extends Record<string, any>>(): Factory<T> {
  const attributes: AttributesFor<T> = {} as AttributesFor<T>;
  const traits: Record<string, AttributesFor<T>> = {};
  const beforeBuildHooks: Array<LifecycleHook<T>> = [];
  const afterBuildHooks: Array<LifecycleHook<T>> = [];

  // Configuration for transient attributes
  let transientAttributes: string[] = [];
  let nestedTransientAttributes: Record<string, string[]> = {};

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

  // Helper to remove transient attributes from an object
  const removeTransientAttributes = (obj: Record<string, any>): void => {
    // Remove top-level transient attributes
    for (const attr of transientAttributes) {
      delete obj[attr];
    }
    // Remove all properties starting with underscore (implicit transient attrs)
    for (const key of Object.keys(obj)) {
      if (key.startsWith('_')) {
        delete obj[key];
      }
    }
    // Remove nested transient attributes
    for (const [key, attrs] of Object.entries(nestedTransientAttributes)) {
      if (obj[key] && typeof obj[key] === 'object') {
        for (const attr of attrs) {
          delete obj[key][attr];
        }
      }
    }
  };

  // Builds a single instance of T
  const buildInstance = (
    options: BuildOptions<T> = {}
  ): {
    instance: T;
    originalAttributes: Partial<WithTransientAttributes<T>>;
  } => {
    const instance = {} as WithTransientAttributes<T>;
    const attributeKeys = Object.keys(attributes);

    // First pass: Apply all static values and direct faker calls
    for (const key of attributeKeys) {
      const value = attributes[key as keyof typeof attributes];
      // Skip attribute functions that depend on other attributes
      if (typeof value === 'function' && !isFakerDirectCall(value)) {
        continue;
      } else if (typeof value === 'function') {
        // For direct faker function calls
        instance[key as keyof typeof instance] = value() as any;
      } else {
        // For static values
        instance[key as keyof typeof instance] = value as any;
      }
    }

    // Apply trait overrides early so they can be used in attribute functions
    if (options.traits) {
      for (const traitName of options.traits) {
        const trait = traits[traitName];
        if (trait) {
          // First pass for traits: static values and direct faker calls
          for (const [key, value] of Object.entries(trait)) {
            if (typeof value === 'function' && !isFakerDirectCall(value)) {
              continue;
            } else if (typeof value === 'function') {
              instance[key as keyof typeof instance] = value() as any;
            } else {
              instance[key as keyof typeof instance] = value as any;
            }
          }
        }
      }
    }

    // Apply direct overrides early too so they can be used in attribute functions
    if (options.overrides) {
      for (const [key, value] of Object.entries(options.overrides)) {
        if (!key.includes('__')) {
          // Handle normal overrides here, nested ones later
          instance[key as keyof typeof instance] = value;
        }
      }
    }

    // Second pass: Apply attribute functions that depend on other attributes
    for (const key of attributeKeys) {
      const value = attributes[key as keyof typeof attributes];
      if (typeof value === 'function' && !isFakerDirectCall(value)) {
        // For attribute functions that require instance and faker
        instance[key as keyof typeof instance] = value(instance, faker) as any;
      }
    }

    // Apply trait attribute functions after basic attributes are set
    if (options.traits) {
      for (const traitName of options.traits) {
        const trait = traits[traitName];
        if (trait) {
          // Second pass for traits: attribute functions
          for (const [key, value] of Object.entries(trait)) {
            if (typeof value === 'function' && !isFakerDirectCall(value)) {
              instance[key as keyof typeof instance] = value(
                instance,
                faker
              ) as any;
            }
          }
        }
      }
    }

    // Apply nested overrides
    if (options.overrides) {
      for (const [key, value] of Object.entries(options.overrides)) {
        if (key.includes('__')) {
          applyNestedOverrides(instance, key, value);
        }
      }
    }

    // Store a copy of the complete attributes including transient ones
    const originalAttributes = { ...instance };
    return { instance: instance as T, originalAttributes };
  };

  // Apply lifecycle hooks synchronously
  const applyHooks = (data: {
    instance: T;
    originalAttributes: Partial<WithTransientAttributes<T>>;
  }): T => {
    // Apply beforeBuild hooks with access to transient attributes
    let result = { ...data.instance };
    // Apply all beforeBuild hooks
    for (const hook of beforeBuildHooks) {
      result = hook(result, data.originalAttributes) as T;
    }
    // Remove transient attributes after beforeBuild hooks but before afterBuild hooks
    removeTransientAttributes(result);
    // Apply all afterBuild hooks
    for (const hook of afterBuildHooks) {
      result = hook(result, data.originalAttributes) as T;
    }
    return result;
  };

  // Apply lifecycle hooks asynchronously
  const applyHooksAsync = async (data: {
    instance: T;
    originalAttributes: Partial<WithTransientAttributes<T>>;
  }): Promise<T> => {
    // Apply beforeBuild hooks
    let result = { ...data.instance };
    // Apply all beforeBuild hooks (which might be async)
    for (const hook of beforeBuildHooks) {
      result = await Promise.resolve(hook(result, data.originalAttributes));
    }
    // Remove transient attributes after beforeBuild hooks but before afterBuild hooks
    removeTransientAttributes(result);
    // Apply all afterBuild hooks (which might be async)
    for (const hook of afterBuildHooks) {
      result = await Promise.resolve(hook(result, data.originalAttributes));
    }
    return result;
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const factory: Factory<T> & Record<string, Function> = {
    define: (newAttributes, options) => {
      Object.assign(attributes, newAttributes);
      // Store transient attribute configuration
      if (options?.transientAttributes) {
        transientAttributes = options.transientAttributes;
      }
      if (options?.nestedTransientAttributes) {
        // Type assertion to ensure proper assignment
        nestedTransientAttributes = Object.entries(
          options.nestedTransientAttributes
        ).reduce<Record<string, string[]>>((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {});
      }
      return factory;
    },

    trait: (name, traitAttributes) => {
      traits[name] = traitAttributes;
      return factory;
    },

    beforeBuild: (hook) => {
      beforeBuildHooks.push(hook);
      return factory;
    },

    afterBuild: (hook) => {
      afterBuildHooks.push(hook);
      return factory;
    },

    build: (options = {}) => {
      const data = buildInstance(options);
      return applyHooks(data);
    },

    buildAsync: async (options = {}) => {
      const data = buildInstance(options);
      return await applyHooksAsync(data);
    },

    buildMany: (count, options = {}) => {
      const results: T[] = [];
      for (let i = 0; i < count; i++) {
        const data = buildInstance(options);
        results.push(applyHooks(data));
      }
      return results;
    },
  };

  return factory;
}
