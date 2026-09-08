class ExpressError extends Error {
    constructor(statusCode, message) {
        super(message);
        console.log(`ExpressError = ${message}`);

        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);

    }
}

module.exports = ExpressError;
