/**
 * Utility to wrap async route handlers and forward errors to Express error handler.
 *
 * @function asyncHandler
 * @param {function} requestHandler - Async route handler function (req, res, next)
 * @returns {function} Wrapped function with error handling
 */
export const asyncHandler = (requestHandler) => (
  async (req, res, next) => {
    try {
      await requestHandler(req, res, next)
    }
    catch (error) {
      next(error)
    }
  }
)


// export const asyncHandler = (requestHandler) => (
//   (req, res, next) => {
//     Promise
//       .resolve(requestHandler(req, res, next))
//       .catch(error => next(error))
//   }
// )