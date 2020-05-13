/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Session.Repository
 */

let loggedBy = {
    loggedBy: { type: 'string' },
    value: { type: 'string' }
};

let session = {
    sessionId: { type: 'string', id: true, required: true, unique: true },
    refreshId: { type: 'string', id: true, required: true, unique: true },
    userId: { type: 'string', required: true },
    isVerified: { type: 'boolean', required: true, default: false, hidden: true },
    loggedBy: { type: 'model', model: loggedBy },
    roles: { type: 'string', required: true, isArray: true },
    stat: { type: 'model', model: require('./shared/stat.model') }
};

module.exports = new (require('../mongo'))(session, 'sessions');