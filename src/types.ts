/**
 * A function that dynamically generates a value for a specific attribute of type T.
 * When this function is called, all attributes defined before this one
 * have already been set on the instance.
 *
 * @template T The object type being built by the factory
 * @template TKey The specific key/property of T being generated
 * @param instance The partially built instance of T
 * @param faker The faker instance for generating random data
 * @returns The value for the specified attribute
 */
export type AttributeFunction<T, TKey extends keyof T> = (
  instance: Partial<T>,
  faker: Faker
) => T[TKey];

/**
 * A lifecycle hook function that can modify the object during the build process.
 *
 * @template T The object type being built by the factory
 * @param object The object being built
 * @returns The modified object (or a Promise of the modified object for async hooks)
 */
export type LifecycleHook<T> = (object: T) => T | Promise<T>;

/**
 * Defines the structure for configuring attributes in a factory.
 * Each attribute can be a static value, a function that generates the value dynamically,
 * or a direct value from a faker function call.
 *
 * @template T The object type being built by the factory
 */
export type AttributesFor<T> = {
  [K in keyof T]?: T[K] | AttributeFunction<T, K>;
};

/**
 * Recursive type for nested property overrides using underscore notation.
 * Allows for properties like "profile_bio" or "profile__preferences_theme".
 *
 * @template T The object type with properties to override
 */
export type NestedOverrides<T> = {
  [K in
    | keyof T
    | `${string & keyof T}_${string}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | `${string & keyof T}__${string}`]?: any;
};

/**
 * Options that can be provided when building an object with a factory.
 *
 * @template T The object type being built by the factory
 * @property {string[]} [traits] - Names of traits to apply to the built object
 * @property {NestedOverrides<T>} [overrides] - Specific attribute values to override, supporting nested overrides
 */
export type BuildOptions<T> = {
  traits?: string[];
  overrides?: Partial<T> & NestedOverrides<T>;
};

/**
 * Represents a factory for creating instances of type T.
 *
 * @template T The object type this factory produces
 */
export interface Factory<T> {
  /**
   * Defines the default attributes for objects created by this factory.
   *
   * @param attributes The default attributes configuration
   * @returns The factory instance for chaining
   */
  define: (attributes: AttributesFor<T>) => Factory<T>;

  /**
   * Defines a named trait (variant) that can be applied when building objects.
   *
   * @param name The name of the trait
   * @param attributes The attributes specific to this trait
   * @returns The factory instance for chaining
   */
  trait: (name: string, attributes: AttributesFor<T>) => Factory<T>;

  /**
   * Adds a hook that runs before the object is finalized.
   *
   * @param hook Function that receives and can modify the object
   * @returns The factory instance for chaining
   */
  beforeBuild: (hook: LifecycleHook<T>) => Factory<T>;

  /**
   * Adds a hook that runs after the object is built.
   *
   * @param hook Function that receives and can modify the object
   * @returns The factory instance for chaining
   */
  afterBuild: (hook: LifecycleHook<T>) => Factory<T>;

  /**
   * Builds a single instance of the object.
   *
   * @param options Optional build configuration including traits and overrides
   * @returns A new instance of type T
   */
  build: (options?: BuildOptions<T>) => T;

  /**
   * Builds a single instance of the object asynchronously.
   * This method is used when hooks contain async operations.
   *
   * @param options Optional build configuration including traits and overrides
   * @returns A Promise that resolves to a new instance of type T
   */
  buildAsync: (options?: BuildOptions<T>) => Promise<T>;

  /**
   * Builds multiple instances of the object.
   *
   * @param count The number of instances to build
   * @param options Optional build configuration including traits and overrides
   * @returns An array of instances of type T
   */
  buildMany: (count: number, options?: BuildOptions<T>) => T[];
}

/**
 * Simplified interface for the Faker library used for generating test data.
 * This avoids direct dependency on the Faker library in type definitions.
 */
export interface Faker {
  name: {
    firstName: () => string;
    lastName: () => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  internet: {
    email: () => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
