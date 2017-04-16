class NotFoundError extends Error {
  constructor(message = 'Resource not found', status = 404) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'NotFoundError';
    this.message = message;
    this.status = status;
  }
}

module.exports = NotFoundError;
