/**
 * The `util` module provides supporting structures that enhance expressiveness and traceability:
 *
 * - {@link Scope}: A hierarchical context used to represent nested logical frames or environments.
 * - {@link Path}: A symbolic record of decisions or transformations applied in sequence.
 *
 * These utilities assist with organizing, tracking, and reasoning about compositional flows.
 *
 * @module util
 */
export { Scope } from './Scope.js';
export { Path } from './Path.js';