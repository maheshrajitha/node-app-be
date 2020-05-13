/**
 * Mongo Client
 * @Author Udara Premadasa
 * @module mongo.client
 */

const MongoClient = require('mongodb').MongoClient;
const logger = require('./logger');
const env = process.env;
const dbUrl = `mongodb://${env.MONGODB_HOST}:${env.MONGODB_PORT}/${env.MONGODB_NAME}`;

/**
 * Mongodb Options
 */
const option = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: env.MONGODB_POOL_SIZE
};

let dbConnection; // database connection object

module.exports = {
    /**
     * Mongodb Connection Initialize
     * @param {*} callback 
     */
    connect: function (callback) {
        logger.info(`${env.MONGODB_NAME} creating connection on Mongodb ...`);
        MongoClient.connect(dbUrl, option, function (err, db) {
            if (err) {
                logger.warn('Database Connection Failed');
                callback(true, null);
            } else {
                dbConnection = db.db(`${env.MONGODB_NAME}`);
                logger.info(`${dbConnection.s.databaseName} connected on Mongodb`);
                if (callback && typeof (callback) == 'function')
                    callback(false, dbConnection);
            }

        });
    },

    /**
     * Get Database Instance and If connection failed reconnect
     * @param {*} callback 
     */
    getInstance: function (callback) {
        if (!dbConnection) {
            this.connect(callback);
        } else {
            callback(false, dbConnection);
        }
    },

    /**
     * A record insert to database
     * @param {*} model 
     * @param {*} data 
     * @param {*} callback 
     */
    insertOne: function (model, data, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).insertOne(data, function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    },

    /**
     * Insert Documents
     * @param {*} model 
     * @param {*} datas 
     * @param {*} callback 
     */
    insertMany: function (model, datas, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).insertMany(datas, function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    },

    /**
     * Update Model
     * @param {*} model 
     * @param {*} query 
     * @param {*} data 
     * @param {*} callback 
     */
    updateOne: function (model, query, data, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).updateOne(query, data, function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    },

    /**
     * Update Many Documents
     * @param {*} model 
     * @param {*} query 
     * @param {*} data 
     * @param {*} callback 
     */
    updateMany: function (model, query, data, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).updateMany(query, data, function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    },

    /**
     * read records from database
     * @param {*} model 
     * @param {*} query 
     * @param {*} callback 
     */
    find: function (model, query, selector, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).find(query).project(selector).toArray(function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    },

    /**
     * read records from database
     * @param {*} model 
     * @param {*} query 
     * @param {*} callback 
     */
    findWithPageble: function (model, query, selector, size, page, sort, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model)
                    .find(query)
                    .project(selector)
                    .skip(page > 0 ? ((page - 1) * size) : 0)
                    .limit(size)
                    .sort(sort)
                    .toArray(function (err, result) {
                        if (err) dbConnection = false;
                        callback(err, result);
                    });
            }
        });
    },

    /**
     * Find One
     * @param {*} model 
     * @param {*} query 
     * @param {*} selector 
     * @param {*} callback 
     */
    findOne: function (model, query, selector, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).findOne(query, {
                    projection: selector
                }, function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    },

    /**
     * Delete a Document
     * @param {*} model 
     * @param {*} query 
     * @param {*} callback 
     */
    deleteOne: function (model, query, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).deleteOne(query, function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    },

    /**
     * Delete Many Documents
     * @param {*} model 
     * @param {*} query 
     * @param {*} callback 
     */
    deleteMany: function (model, query, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).deleteMany(query, function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    },

    /**
     * Mongo Aggregation
     * @param {*} model 
     * @param {*} agQuery 
     * @param {*} callback 
     */
    aggregate: function (model, agQuery, callback) {
        this.getInstance(function (err, db) {
            if (err) {
                callback(true, null);
            } else {
                db.collection(model).aggregate(agQuery).toArray(function (err, result) {
                    if (err) dbConnection = false;
                    callback(err, result);
                });
            }
        });
    }
};