/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Category.Service
 */

const uuidv1 = require('uuid/v1');

const error = require('../error');

const categoryRepository = require('../repositories/category.repository');

const env = process.env;

module.exports = {
    create: function(req, res, next) {
        let category = req.body;
        category.categoryId = uuidv1();
        category.status = true;
        category.stat = {
            create: {
                userId: req.userId,
                date: new Date()
            }
        };
        categoryRepository.save(category, function (err, exception, result) {
            if (err) {
                next(new error('failed to save category', exception, 400));
            } else {
                res.status(201).json(result);
            }
        })
    },

    list: function(req, res, next) {
        categoryRepository.get({status: true}, function(err, result){
            res.status(200).json(result);
        });
    }
}