/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Authorize-Request
 */

const logger = require('./logger.app');

module.exports = function (req, res, next) {
    if (process.env.NODE_ENV == 'dev' || req.method == 'OPTIONS') {
        next();
    } else {
        if ('request-id' in req.headers)
            next();
        else
            res.status(403).json({ 'error': 'api request cant authenticate' });
    }
}