/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module User.Repository
 */

let dob = {
    year: { type: 'number' },
    month: { type: 'number' },
    day: { type: 'number' }
};

let basic = {
    firstName: { type: 'string', required: true },
    lastName: { type: 'string' },
    gender: { type: 'enum', values: ['Male', 'Female'] },
    dob: { type: 'model', model: dob }
}

let phone = {
    phone: { type: 'string' },
    phoneType: { type: 'string', default: 'none' },
    isPrimary: { type: 'boolean', default: false },
    isConfirmed: { type: 'boolean', default: false }
};

let email = {
    email: { type: 'email' },
    emailType: { type: 'string', default: 'none' },
    isPrimary: { type: 'boolean', default: false },
    isConfirmed: { type: 'boolean', default: false }
};

let contact = {
    phoneNumbers: { type: 'model', model: phone, isArray: true },
    emailAddresses: { type: 'model', model: email, isArray: true }
};

let social = {
    social: { type: 'string' },
    socialId: { type: 'string', hidden: true },
    link: { type: 'string' },
    isConnected: { type: 'boolean' }
};

let profile = {
    basic: { type: 'model', model: basic },
    contact: { type: 'model', model: contact },
    socialMedias: { type: 'model', model: social, isArray: true }
};

let security = {
    password: { type: 'password', required: true }
}

let user = {
    userId: { type: 'string', id: true, required: true, unique: true },
    username: { type: 'string', required: true, unique: true },
    profile: { type: 'model', model: profile },
    security: { type: 'model', model: security, hidden: true },
    isEnabled: { type: 'boolean', required: true, default: false, hidden: true },
    isVerified: { type: 'boolean', required: true, default: false, hidden: true },
    roles: { type: 'string', required: true, isArray: true, hidden: true },
    stat: { type: 'model', model: require('./shared/stat.model') }
};

module.exports = new (require('../mongo'))(user, 'users');