/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Category.Repository
 */

let category = {
    categoryId: { type: 'string', id: true, required: true, unique: true },
    name: { type: 'string', required: true, unique: true, ignoreCases: true },
    icon: { type: 'string' },
    status: { type: 'boolean' },
    stat: { type: 'model', model: require('./shared/stat.model') }
};

module.exports = new (require('../mongo'))(category, 'category');