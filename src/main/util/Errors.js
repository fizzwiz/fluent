/**
 * Utilities for working with errors
 */
export class Errors {

  /**
   * Check if an error matches a condition.
   *
   * Supported matchers:
   * - number → matches statusCode 
   * - string → matches class name (e.g. "HttpError", "DomError")
   * - RegExp → tests against error message
   * - function → custom predicate `(err) => boolean`
   *
   * @param {Error} err - The error instance to test
   * @param {string|number|RegExp|Function} matcher
   * @returns {boolean}
   */
  static matches(err, matcher) {
    
    if (err == null) return false;

    switch (typeof matcher) {
      case "number":
        return err.statusCode === matcher;

      case "string":
        return err.constructor?.name === matcher;

      case "function":
        return matcher(err);

      case "object":
        if (matcher instanceof RegExp) {
          return matcher.test(err.message);
        }
        return false;

      default:
        return false;
    }
  }
}
