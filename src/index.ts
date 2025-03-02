/**
 * Factory Kit - A factory pattern implementation for generating test data
 */

// Export everything from the core factory module
export { createFactory } from '@/factory';
export { resetSequence, sequence } from '@/sequence';
export { clearAllUniqueStores, clearUniqueStore, unique } from '@/unique';

// Export type definitions
export type {
  AttributeFunction,
  AttributesFor,
  BuildOptions,
  Factory,
} from '@/types';
