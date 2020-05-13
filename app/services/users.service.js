/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Users.Service
 */

const uuidv1 = require('uuid/v1');

const error = require('../error');
const hash = require('../util/password');
const emailValidator = require('../util/email');
const logger = require('../logger.app');
const userRole = require('../role.user');

const userRepository = require('../repositories/user.repository');

const env = process.env;

let userValidate = function (newUser, callback) {
    let error = false;
    let exception = {};
    if (typeof newUser.firstName != 'string' || (newUser.firstName).length === 0) {
        error = true;
        exception.firstName = 'First Name is required';
    }
    if (typeof newUser.lastName != 'string' || (newUser.lastName).length === 0) {
        error = true;
        exception.lastName = 'First Name is required';
    }
    if (typeof newUser.email != 'string' || (newUser.email).length === 0) {
        error = true;
        exception.email = 'Email is required';
    } else if (!emailValidator.isValid(newUser.email)) {
        error = true;
        exception.email = 'Email is not valid';
    }
    if (typeof newUser.password != 'string' || newUser.password == '') {
        error = true;
        exception.password = 'Password is required';
    } else if ((newUser.password).length < 6) {
        error = true;
        exception.password = 'Password is not meet required';
    }
    userRepository.get({ 'profile.contact.emailAddresses.email': newUser.email }, function (err, result) {
        if (result.length > 0) {
            error = true;
            exception.email = 'Email is already used';
        }
        callback(error, exception);
    }, ['profile.contact.emailAddresses.email']);
};

module.exports = {

    /**
     * POST /users Save User
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    save: function (req, res, next) {
        let newUser = req.body;
        userValidate(newUser, function (userValidateErr, userValidateException) {
            if (userValidateErr) {
                next(new error('failed to save user', userValidateException, 400));
            } else {
                hash.hash(newUser.password, function (hashErr, hash) {
                    if (hashErr) {
                        next(new error('Password Hashing Error', undefined, 400));
                    } else {
                        let user = {};
                        user.userId = uuidv1();
                        if (typeof newUser.username === 'undefined') {
                            user.username = newUser.email;
                        } else {
                            user.username = newUser.username;
                        }
                        user.profile = {
                            basic: {
                                firstName: newUser.firstName,
                                lastName: newUser.lastName
                            },
                            contact: {
                                emailAddresses: [
                                    {
                                        email: newUser.email,
                                        isPrimary: true,
                                        isConfirmed: false
                                    }
                                ]
                            }
                        };
                        user.security = {
                            password: hash
                        };
                        user.isEnabled = true;
                        user.roles = [userRole.user.key];
                        user.stat = {
                            create: {
                                userId: user.userId,
                                date: new Date()
                            }
                        };
                        userRepository.save(user, function (err, exception, result) {
                            if (err) {
                                next(new error('failed to save user', exception, 400));
                            } else {
                                delete result['security'];
                                delete result['roles'];
                                delete result['isEnabled'];
                                res.status(201).json(result);
                            }
                        });
                    }
                });


            }
        });
    },

    /**
     * Get Me
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getMe: function (req, res, next) {
        if (typeof req.userId != 'undefined' && req.userId != null) {
            userRepository.getOne({ userId: req.userId }, function (fetchUserError, fetchUser) {
                if (fetchUserError) {
                    res.clearCookie('at');
                    res.clearCookie('rt');
                    next(new error('Unauthorized', undefined, 401, 401));
                } else {
                    res.status(200).json(fetchUser);
                }
            });
        } else {
            res.clearCookie('at');
            res.clearCookie('rt');
            next(new error('Unauthorized', undefined, 401, 401));
        }
    },

    getPage: function (req, res, next) {
        userRepository.get({}, function (err, result) {
            if (err) {
                next(new error('Error', undefined, 400));
            } else {
                res.status(200).json(result);
            }
        });
    },
}