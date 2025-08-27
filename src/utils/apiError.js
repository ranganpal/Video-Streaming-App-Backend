/**
 * Custom error class for API errors.
 *
 * @class ApiError
 * @extends Error
 * @param {number} statusCode - HTTP status code for the error
 * @param {string} message - Error message
 */
export class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message)
    this.statusCode = statusCode
    this.data = null
    // this.message = message
    this.success = false
    this.errors = errors

    if (stack) {
      this.stack = stack
    }
    else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}