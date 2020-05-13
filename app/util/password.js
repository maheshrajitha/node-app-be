/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Password
 */


const bcrypt = require('bcryptjs');
const saltRounds = 10;

module.exports = {
    hash: function (plaintext, callback) {
        if (typeof plaintext === 'undefined' || plaintext === '') {
            callback(false, undefined);
        } else {
            bcrypt.hash(plaintext, saltRounds, callback);
        }
    },

    check: function (plaintext, hashtext, callback) {
        bcrypt.compare(plaintext, hashtext, callback);
    }
}