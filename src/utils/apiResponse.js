/**
 * Standard API response class for consistent response formatting.
 *
 * @class ApiResponse
 * @param {boolean} success - Indicates if the request was successful
 * @param {string} message - Response message
 * @param {object} [data] - Optional response data
 */
export class ApiResponse {
  constructor(
    statusCode,
    data,
    message = "Success"
  ) {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
  }
}