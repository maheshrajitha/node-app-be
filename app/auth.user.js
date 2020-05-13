/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Authorize.User
 */
const uuidv1 = require('uuid/v1');
const uuidv5 = require('uuid/v5');

const error = require('./error');

const logger = require('./logger.app');

const cache = require('./redis.client');

const userRepository = require('./repositories/user.repository');
const sessionRepository = require('./repositories/session.repository');
const oldSessionRepository = require('./repositories/oldSession.repository');

const env = process.env;

let checkAccessToken = function (cookies, roles, callback) {
    if (typeof cookies['at'] != 'undefined') {
        cache.get(cookies['at'], function (err, reply) {
            if (err || typeof reply === 'undefined' || reply == null) {
                callback(true, undefined);
            } else {
                let session = JSON.parse(reply);
                if (roles.length === 0 || roles.filter(value => session.roles.includes(value)).length > 0) {
                    callback(false, session);
                } else {
                    callback(true, undefined);
                }
            }
        });
    } else {
        callback(true, undefined);
    }
};

let checkRefreshToken = function (cookies, roles, callback) {
    if (typeof cookies['rt'] != 'undefined') {
        sessionRepository.getOne({ refreshId: cookies['rt'] }, function (fetchSessionError, fetchSession) {
            if (!fetchSessionError && fetchSession != null && fetchSession.userId != null && fetchSession.sessionId != null && fetchSession.refreshId != null) {
                userRepository.getOne({ userId: fetchSession.userId }, function (fetchUserError, fetchUser) {
                    if (!fetchUserError && fetchUser != null && fetchUser.isEnabled && (roles.length === 0 || roles.filter(value => fetchUser.roles.includes(value)).length  > 0)) {
                        let oldSession = fetchSession;
                        oldSession.reason = 'token refreshed';
                        oldSession.stat.lastUpdate = {
                            userId: fetchUser.userId,
                            date: new Date()
                        }
                        oldSessionRepository.save(oldSession, function (oldSessionSavingErr, oldSessionSaving) {
                            if (oldSessionSavingErr) {
                                logger.debug(`old session saving failed => ${JSON.stringify(oldSession)}`)
                            } else {
                                logger.info(`${oldSession.sessionId} saved as old session`);
                            }
                        });
                        sessionRepository.deleteOne({ sessionId: fetchSession.sessionId, refreshId: fetchSession.refreshId }, function (oldSessionRemoveErr, oldSessionRemove) {
                            if (oldSessionRemoveErr) {
                                logger.debug(`old session removing failed => ${JSON.stringify(fetchSession)}`)
                            } else {
                                logger.info(`${fetchSession.sessionId} removed from session store`);
                            }
                        });
                        cache.del(fetchSession.sessionId, function (oldSessionRemoveCacheErr, oldSessionRemoveCache) {
                            if (oldSessionRemoveCacheErr) {
                                logger.debug(`old session removing failed => ${JSON.stringify(fetchSession)} from cache`)
                            } else {
                                logger.info(`${fetchSession.sessionId} removed from session store on cache`);
                            }
                        });
                        let uuid = uuidv1();
                        let newSession = {
                            sessionId: uuidv5('si', uuid),
                            refreshId: uuidv5('ri', uuid),
                            userId: fetchUser.userId,
                            roles: fetchUser.roles,
                            isVerified: fetchUser.isVerified,
                            loggedBy: oldSession.loggedBy,
                            stat: {
                                create: {
                                    userId: fetchUser.userId,
                                    date: new Date()
                                }
                            }
                        };
                        sessionRepository.save(newSession, function (err, exception, dbSession) {
                            if (err) {
                                logger.debug(JSON.stringify(exception));
                                callback(true, undefined);
                            } else {
                                cache.set(newSession.sessionId, JSON.stringify(newSession), function (err, reply) {
                                    if (err) {
                                        logger.debug("Cache store error");
                                        callback(true, undefined);
                                    } else {
                                        logger.info(`created new session as ${newSession.sessionId}`);
                                        callback(false, newSession);
                                    }
                                });
                            }
                        });
                    } else {
                        callback(true, undefined);
                    }
                }, [ 'userId', 'username', 'roles', 'isEnabled', 'profile.contact.emailAddresses' ]);
            } else {
                callback(true, undefined);
            }
        });
    } else {
        callback(true, undefined);
    }
}

let authorize = function(req, res, roles, callback) {
    if (typeof req.cookies != 'undefined') {
        checkAccessToken(req.cookies, roles, function (err, session) {
            if (!err) {
                req.userId = session.userId;
                req.isVerified = session.isVerified;
                res.header('isVerifiedUser', session.isVerified);
                callback(false, req, res);
            } else {
                checkRefreshToken(req.cookies, roles, function (err, session) {
                    if (!err) {
                        req.userId = session.userId;
                        req.isVerified = session.isVerified;
                        res.cookie("at", session.sessionId, { maxAge: env.ACCESS_SESSION_TIMEOUT, httpOnly: true });
                        res.cookie("rt", session.refreshId, { maxAge: env.REFRESH_SESSION_TIMEOUT, httpOnly: true });
                        res.header('isVerifiedUser', session.isVerified);
                        callback(false, req, res);
                    } else {
                        res.clearCookie("at");
                        res.clearCookie("rt");
                        callback(true, req, res);
                    }
                });
            }
        });
    } else {
        callback(true, req, res);
    }
}

module.exports = function (roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    return [
        (req, res, next) => {
            authorize(req, res, roles, function(err, request, response) {
                if (!err || roles.length === 0) {
                    next();
                } else {
                    next(new error('Unauthorized', undefined, 401, 401));
                }
            });
        }
    ];
};