/**
 * Utilities for working with errors
 */
export class Errors {

  /**
   * Check whether a thrown value or Error matches a specified condition.
   * 
   * Supports:
   * - Functions: `matcher(err)` returns boolean
   * - Primitives: equality check (`===`)
   * - Error instances: matches constructor name, statusCode, or message
   * - Strings: can be matched by a RegExp
   * 
   * @param {*} err - The thrown value (can be primitive, string, or Error)
   * @param {string|number|RegExp|Function} matcher - Matching condition
   * @returns {boolean} True if `err` matches `matcher`, false otherwise
   */
  static matches(err, matcher) {
    
    if (typeof matcher === 'function') {
      try {
          return matcher(err);
      } catch (_err) {
          return false; // matcher threw an exception, treat as no match
      }
    }

    if (err == null) return false;    
    if (err === matcher) return true;

    if (err instanceof Error) {
      return this.matches(err.constructor.name, matcher) ||
            this.matches(err.statusCode, matcher) ||
            this.matches(err.message, matcher);
    }

    if (typeof err === 'string') {
      if (typeof matcher === 'string') 
          return err.includes(matcher);
      else if (matcher instanceof RegExp) {
        return matcher.test(err);
      }
    }

    return false;
  }

}

/**
 * Error thrown when an operation times out.
 * @extends Error
 */
export class TimeoutError extends Error {
  constructor(millis, message = "Operation timed out", cause) {
    super(message);
    this.millis = millis;
    this.name = this.constructor.name;
    if (cause) this.cause = cause;
  }
}

