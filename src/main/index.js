import { Each } from './core/Each.js';
import { AsyncEach } from './core/AsyncEach.js';
import { What } from './core/What.js';
import { AsyncWhat } from './core/AsyncWhat.js';
import { Scope } from './util/Scope.js';
import { Path } from './util/Path.js';

export { Each, AsyncEach, What, AsyncWhat, Scope, Path };

/**
 * The `core` module defines three fundamental classes for declarative, fluent programming:
 *
 * - {@link Each}: A lazy, composable iterable abstraction for synchronous sequences.
 * - {@link AsyncEach}: A lazy, composable iterable abstraction for asynchronous sequences,
 *   mirroring the {@link Each} class in the Promise domain.
 * - {@link What}: A fluent interface for composing and transforming functions declaratively.
 *
 * @module core
 */

/**
 * The `util` module provides supporting structures that enhance expressiveness and traceability:
 *
 * - {@link Scope}: A hierarchical context used to represent nested logical frames or environments.
 * - {@link Path}: A symbolic record of decisions or transformations applied in sequence.
 *
 * @module util
 */
