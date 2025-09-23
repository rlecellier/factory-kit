/**
 * A function that dynamically generates a value for a specific attribute of type T.
 * When this function is called, all attributes defined before this one
 * have already been set on the instance.
 *
 * @template T The object type being built by the factory
 * @template TKey The specific key/property of T being generated
 * @param instance The partially built instance of T with guaranteed required fields
 * @param faker The faker instance for generating random data
 * @returns The value for the specified attribute
 */
export type AttributeFunction<T, TKey extends keyof T> = (
  instance: Partial<T> & Pick<T, RequiredKeys<T>>,
  faker: Faker
) => T[TKey];

/**
 * Helper type to extract required keys from a type
 */
type RequiredKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Helper type to extract optional keys from a type
 */
type OptionalKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Helper type to extract additional keys that TExtended has beyond T
 */
type AdditionalKeys<TExtended, T> = {
  [K in keyof TExtended]: K extends keyof T ? never : K;
}[keyof TExtended];

/**
 * Type for defining additional attributes when extending a factory.
 * Only requires the additional properties that TExtended adds beyond T.
 */
export type ExtendedAttributesFor<TExtended, T> = {
  [K in AdditionalKeys<TExtended, T> as K extends RequiredKeys<TExtended>
    ? K
    : never]: TExtended[K] | AttributeFunction<TExtended, K>;
} & {
  [K in AdditionalKeys<TExtended, T> as K extends RequiredKeys<TExtended>
    ? never
    : K]?: TExtended[K] | AttributeFunction<TExtended, K>;
} & {
  // Allow overriding inherited properties
  [K in keyof T & keyof TExtended]?:
    | TExtended[K]
    | AttributeFunction<TExtended, K>;
};

/**
 * Defines the structure for configuring attributes in a factory.
 * Each attribute can be a static value, a function that generates the value dynamically,
 * or a direct value from a faker function call.
 *
 * Required properties of T must be defined in the factory,
 * while optional properties remain optional.
 *
 * @template T The object type being built by the factory
 */
export type AttributesFor<T> = {
  [K in RequiredKeys<T>]: T[K] | AttributeFunction<T, K>;
} & {
  [K in OptionalKeys<T>]?: T[K] | AttributeFunction<T, K>;
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
 * Factory interface for extended factories that only require additional attributes
 */
export interface ExtendedFactory<TExtended, T> {
  /**
   * Defines the additional attributes for the extended type
   */
  define: (
    attributes: ExtendedAttributesFor<TExtended, T>
  ) => Factory<TExtended>;
}

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
  trait: (name: string, attributes: Partial<AttributesFor<T>>) => Factory<T>;

  /**
   * Creates a new factory that extends this one for a subtype.
   *
   * @template TExtended The extended type that includes all properties of T
   * @returns A new extended factory instance that only requires additional attributes
   */
  extend: <TExtended extends T>() => ExtendedFactory<TExtended, T>;

  /**
   * Builds a single instance of the object.
   *
   * @param options Optional build configuration including traits and overrides
   * @returns A new instance of type T
   */
  build: (options?: BuildOptions<T>) => T;

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
