/**
 * Epicalytic
 * @Author Udara Premadasa
 */

module.exports = function (message, exception, errorCode, statusCode) {
    Error.captureStackTrace(this, this.constructor);
    this.message = message || 'Application Error';
    this.exception = exception;
    this.statusCode = statusCode || 400;
    this.errorCode = errorCode || 400;
}