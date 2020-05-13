/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module App.Validation
 */

const logger = require('./logger.app');
const env = process.env;

/**
 * check is valid and expired
 * @param {*} secret 
 */
function isValid(secret) {
    if (secret == 'null') {
        return false;
    } else {
        return true;
    }
}

module.exports = {
    /**
     * Application Validate
     * @param {*} callback 
     */
    check: function (callback) {
        if (typeof env.APP_SECRET == 'undefined' || !isValid(env.APP_SECRET)) {
            logger.error('Application Registration Failed. Please Update Application Secret')
            callback(true);
        } else {
            callback(false);
        }
    }
};