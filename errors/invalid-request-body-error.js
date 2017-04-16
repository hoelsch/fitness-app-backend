class InvalidRequestBodyError extends Error {
  constructor(message = 'Invalid request body', status = 400) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'InvalidRequestBodyError';
    this.message = message;
    this.status = status;
  }
}

module.exports = InvalidRequestBodyError;
