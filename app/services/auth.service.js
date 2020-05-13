/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Auth.Service
 */

const error = require('../error');
const uuidv1 = require('uuid/v1');
const uuidv5 = require('uuid/v5');

const hash = require('../util/password');
const emailValidator = require('../util/email');
const logger = require('../logger.app');
const userRole = require('../role.user');

const cache = require('../redis.client');

const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');

const env = process.env;

let getUserByEmailOrUsername = function (username, callback) {
    userRepository.getOne({ username: username }, function (usernameErr, usernameResult) {
        if (usernameErr || typeof usernameResult === 'undefined' || usernameResult == null) {
            userRepository.getOne({ 'profile.contact.emailAddresses.email': username }, function (emailErr, emailResult) {
                if (emailErr) {
                    callback(true, undefined);
                } else {
                    if (typeof emailResult === 'undefined' || emailResult == null || !(emailResult.profile.contact.emailAddresses.find(em => em.email === username).isPrimary)) {
                        callback(true, undefined);
                    } else {
                        emailResult.loggedBy = {
                            loggedBy: 'email',
                            value: username
                        };
                        callback(false, emailResult);
                    }
                }
            }, ['userId', 'username', 'security', 'roles', 'isEnabled', 'profile.contact.emailAddresses', 'isVerified']);
        } else {
            usernameResult.loggedBy = {
                loggedBy: 'username',
                value: username
            };
            callback(false, usernameResult);
        }
    }, ['userId', 'username', 'security', 'roles', 'isEnabled', 'profile.contact.emailAddresses', 'isVerified']);
};

module.exports = {
    /**
     * POST /auth/login
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    login: function (req, res, next) {
        let credentials = req.body;
        let exception = {};
        if (typeof req.cookies['at'] != 'undefined' || typeof req.cookies['rt'] != 'undefined') {
            next(new error('user already logged in', undefined, 500));
        } else if (typeof credentials.username === 'undefined' || credentials.username == '' || typeof credentials.password === 'undefined' || credentials.password == '') {
            exception.username = (typeof credentials.username === 'undefined' || credentials.username == '') ? 'username | email required' : undefined;
            exception.password = (typeof credentials.password === 'undefined' || credentials.password == '') ? 'password required' : undefined;
            next(new error('failed to login user', exception, 400));
        } else {
            getUserByEmailOrUsername(credentials.username, function (userGettingError, fetchUser) {
                if (userGettingError) {
                    next(new error('incorrect username and password', undefined, 400));
                } else {
                    hash.check(credentials.password, fetchUser.security.password, function (err, isMatch) {
                        if (!err && isMatch) {
                            if (fetchUser.isEnabled) {
                                let uuid = uuidv1();
                                let newSession = {
                                    sessionId: uuidv5('si', uuid),
                                    refreshId: uuidv5('ri', uuid),
                                    userId: fetchUser.userId,
                                    roles: fetchUser.roles,
                                    isVerified: fetchUser.isVerified,
                                    loggedBy: fetchUser.loggedBy,
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
                                        next(new error('login error with session db', undefined, 400));
                                    } else {
                                        cache.set(newSession.sessionId, JSON.stringify(newSession), function (err, reply) {
                                            if (err) {
                                                logger.debug("Cache store error");
                                                next(new error('cache store error', undefined, 400));
                                            } else {
                                                res.cookie("at", dbSession.sessionId, { maxAge: env.ACCESS_SESSION_TIMEOUT, httpOnly: true });
                                                res.cookie("rt", dbSession.refreshId, { maxAge: env.REFRESH_SESSION_TIMEOUT, httpOnly: true });
                                                res.header('isVerifiedUser', fetchUser.isVerified);
                                                delete fetchUser.security;
                                                delete fetchUser.roles;
                                                delete fetchUser.isEnabled;
                                                delete fetchUser.isVerified;
                                                res.status(200).json(fetchUser);
                                            }
                                        });
                                    }
                                });

                            } else {
                                next(new error('user has been disabled', undefined, 400));
                            }
                        } else {
                            next(new error('incorrect username and password', undefined, 400));
                        }
                    });
                }
            });
        }
    },

    logout: function (req, res, next) {
        let cookies = req.cookies;
        if (typeof cookies['rt'] != 'undefined') {
            sessionRepository.getOne({ refreshId: cookies['rt'] }, function (fetchSessionError, fetchSession) {
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
            });
        }
        res.clearCookie('at');
        res.clearCookie('rt');
        res.status(200).json({ 'message': 'logout' });
    }
}