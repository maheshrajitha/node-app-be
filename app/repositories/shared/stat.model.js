/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Stat.Model
 */
let create = {
    userId: { type: 'string' },
    date: { type: 'date' }
};


let lastUpdate = {
    userId: { type: 'string' },
    date: { type: 'date' }
};

module.exports = {
    create: { type: 'model', model: create },
    lastUpdate: { type: 'model', model: lastUpdate },
};