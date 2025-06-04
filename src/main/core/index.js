/**
 * The `core` module defines two fundamental classes for declarative, fluent programming:
 *
 * - {@link Each}: Represents a chainable, symbolic structure for defining and refining iterations. These iterations are formally constructed but not executed until needed.
 *
 * - {@link What}: Represents a fluent interface for composing and transforming functions. 
 *
 * Both classes support intuitive method chaining for composing logic, filtering results, and transforming behavior in a readable way.
 *
 * @module core
 */
export { Each } from './Each.js';
export { What } from './What.js';