/**
 * Creates a standard JSON response.
 * @param {number} status - The status of the request.
 * @param {string} message - A message describing the result.
 * @param {any} data - Any data returned (if any).
 * @returns {Object} The JSON response object.
 */
function createResponse(status, message, data = null) {
  return {
    status,
    message,
    data,
  };
}

export default createResponse;
