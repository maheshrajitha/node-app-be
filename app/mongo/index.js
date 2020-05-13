/**
 * Mongo Client
 * @Author Udara Premadasa
 * @module Schema
 */

const mongo = require('./client');

/**
 * Email Validation
 * @param {*} email 
 */
let validateEmail = function (email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Validate Custom Data type
 * @param {*} re 
 * @param {*} value 
 */
let validateRegex = function (re, value) {
    return new RegExp(re).test(value);
}

/**
 * 
 * @param {*} model 
 * @param {*} schema 
 * @param {*} dataArray 
 * @param {*} callback 
 */
let validateSchemaArray = function (model, schema, dataArray, callback) {
    let error = false;
    let errorData = [];
    let progress = 0;
    let checkpoint = function () {
        progress++;
        if (progress < dataArray.length) {
            return false;
        } else {
            callback(error, errorData, dataArray);
        }
    };
    for (let dataIndex = 0; dataIndex < dataArray.length; dataIndex++) {
        new (function (data, index) {
            if (schema.type === 'model') {
                validateSchema(model, schema.model, null, data, function (err, exception, updatedData) {
                    if (err) {
                        error = true;
                        errorData[index] = { index: index, exception: exception };
                    } else {
                        dataArray[index] = updatedData;
                    }
                    checkpoint();
                });
            } else if ( (schema.type === 'string' && typeof dataArray[index] != 'undefined' && typeof dataArray[index] != 'string') ||  (schema.type === 'number' && typeof dataArray[index] != 'undefined' && typeof dataArray[index] != 'number')) {
                error = true;
                errorData[index] = (`${dataArray[index]} is not valid`);
                checkpoint();
            } else {
                checkpoint();
            }

        })(dataArray[dataIndex], dataIndex);
    }
}

/**
 * Validate Schema
 * @param {*} model 
 * @param {*} schema 
 * @param {*} path 
 * @param {*} data 
 * @param {*} callback 
 */
let validateSchema = function (model, schema, path, data, callback) {
    let error = false;
    let exception = {};
    let progress = 0;
    let schemaKeys = Object.keys(schema);
    let dataKeys = Object.keys(data);
    if ((schemaKeys.length == 0 || !(dataKeys.every(val => schemaKeys.includes(val)))) && !Array.isArray(data)) {
        error = true;
        exception = 'Invalid Data Model';
        callback(error, exception, data);
        return false;
    }
    if (typeof data === 'undefined') {
        data = {};
    }
    let checkpoint = function () {
        progress++;
        if (progress < schemaKeys.length) {
            return false;
        } else {
            if (Object.getOwnPropertyNames(data).length === 0) {
                data = undefined;
            }
            callback(error, exception, data);
        }
    };
    for (let i = 0; i < schemaKeys.length; i++) {
        new (function (schemaKey) {
            let schemaTypeIsStringType = typeof schema[schemaKey].type === 'string';
            let dataIsUndefined = typeof data[schemaKey] === 'undefined';
            let schemaIsArray = typeof schema[schemaKey].isArray === 'boolean' && schema[schemaKey].isArray;
            if (schemaTypeIsStringType && schema[schemaKey].type === 'model' && !schemaIsArray) {
                let newPath = schemaKey;
                if (path != null) {
                    newPath = `${path}.${schemaKey}`;
                }
                if (dataIsUndefined) {
                    data[schemaKey] = {};
                }
                validateSchema(model, schema[schemaKey].model, newPath, data[schemaKey], function (err, ex, updatedData) {
                    if (err) {
                        error = err;
                        exception[schemaKey] = ex;
                    }
                    data[schemaKey] = updatedData;
                    checkpoint();
                });
            } else if (typeof schema[schemaKey].default != 'undefined' && dataIsUndefined) {
                data[schemaKey] = schema[schemaKey].default;
                checkpoint();
            } else if (typeof schema[schemaKey].required === 'boolean' && schema[schemaKey].required && dataIsUndefined) {
                error = true;
                exception[schemaKey] = (`${schemaKey} required, it does not exists`);
                checkpoint();
            } else if (schemaTypeIsStringType && schemaIsArray && !dataIsUndefined) {
                if (!Array.isArray(data[schemaKey])) {
                    error = true;
                    exception[schemaKey] = (`${schemaKey} is not a array`);
                    checkpoint();
                } else if (data[schemaKey].length === 0 && ((typeof schema[schemaKey].canEmpty === 'boolean' && !schema[schemaKey].canEmpty) || (typeof schema[schemaKey].required === 'boolean' && schema[schemaKey].required))) {
                    error = true;
                    exception[schemaKey] = (`${schemaKey} is can not be empty array`);
                    checkpoint();
                } else if (typeof schema[schemaKey].minLength === 'number' && schema[schemaKey].minLength > data[schemaKey].length) {
                    error = true;
                    exception[schemaKey] = (`${schemaKey} is must be contain minimum ${schema[schemaKey].minLength}`);
                    checkpoint();
                } else if (typeof schema[schemaKey].maxLength === 'number' && schema[schemaKey].maxLength < data[schemaKey].length) {
                    error = true;
                    exception[schemaKey] = (`${schemaKey} is must be contain maximum ${schema[schemaKey].maxLength}`);
                    checkpoint();
                } else if (!dataIsUndefined && data[schemaKey].length > 0) {
                    validateSchemaArray(model, schema[schemaKey], data[schemaKey], function (err, errorData, updatedData) {
                        if (err) {
                            error = err;
                            exception[schemaKey] = errorData;
                        } else {
                            data[schemaKey] = updatedData;
                        }
                        checkpoint();
                    });
                }
            } else if (schemaTypeIsStringType && schema[schemaKey].type === 'string' && !dataIsUndefined && typeof data[schemaKey] != 'string') {
                error = true;
                exception[schemaKey] = (`${schemaKey} is not valid`);
                checkpoint();
            } else if (schemaTypeIsStringType && schema[schemaKey].type === 'number' && !dataIsUndefined && typeof data[schemaKey] != 'number') {
                error = true;
                exception[schemaKey] = (`${schemaKey} is not valid`);
                checkpoint();
            } else if (schemaTypeIsStringType && schema[schemaKey].type === 'enum' && (typeof schema[schemaKey].values === 'undefined' || !Array.isArray(schema[schemaKey].values) || schema[schemaKey].values.length == 0 || (!dataIsUndefined && !schema[schemaKey].values.includes(data[schemaKey])))) {
                error = true;
                exception[schemaKey] = (`${data[schemaKey]} is not a valid value for ${schemaKey}`);
                checkpoint();
            } else if (!dataIsUndefined && typeof schema[schemaKey].disabled === 'boolean' && schema[schemaKey].disabled) {
                error = true;
                exception[schemaKey] = 'Data Field Disabled';
                checkpoint();
            } else if (!dataIsUndefined && typeof schema[schemaKey].type != 'undefined' && schema[schemaKey].type === 'custom') {
                if (typeof schema[schemaKey].regex != 'undefined' && !validateRegex(schema[schemaKey].regex, data[schemaKey])) {
                    error = true;
                    if (typeof schema[schemaKey].errorMessage) {
                        exception[schemaKey] = schema[schemaKey].errorMessage;
                    } else {
                        exception[schemaKey] = `${data[schemaKey]} is not a Valid value`;
                    }
                }
                checkpoint();
            } else if (!dataIsUndefined && typeof schema[schemaKey].type != 'undefined' && schema[schemaKey].type === 'email' && !validateEmail(data[schemaKey])) {
                error = true;
                exception[schemaKey] = (`${data[schemaKey]} is not a valid email`);
                checkpoint();
            } else if (!dataIsUndefined && typeof schema[schemaKey].type != 'undefined' && schema[schemaKey].type === 'boolean' && typeof data[schemaKey] != 'boolean') {
                error = true;
                exception[schemaKey] = (`${data[schemaKey]} must be boolean value`);
                checkpoint();
            } else if (typeof schema[schemaKey].unique === 'boolean' && schema[schemaKey].unique && !dataIsUndefined) {
                let query = {};
                let options = (typeof schema[schemaKey].ignoreCases === 'boolean' && schema[schemaKey].ignoreCases) ? 'i' : 'c';
                if (path == null) {
                    query[schemaKey] = { $regex: new RegExp(data[schemaKey]), $options: options };
                } else {
                    query[`${path}.${schemaKey}`] = { $regex: new RegExp(data[schemaKey]), $options: options };
                }
                mongo.find(model, query, {}, function (err, result) {
                    if (result.length > 0) {
                        error = true;
                        exception[schemaKey] = (`${schemaKey} can not be duplicate. ${data[schemaKey]} already exists`);
                    }
                    checkpoint();
                })
            } else {
                checkpoint();
            }
        })(schemaKeys[i]);
    }
}

/**
 * filter field
 * @param {*} schema 
 * @param {*} callback 
 */
let selectField = function (schema, callback) {
    let schemaKeys = Object.keys(schema);
    let selected = {};
    let progress = 0;
    if (schemaKeys.length === 0) {
        callback(selected);
        return false;
    }
    let checkpoint = function () {
        progress++;
        if (progress < schemaKeys.length) {
            return false;
        } else {
            callback(selected);
        }
    };
    for (let i = 0; i < schemaKeys.length; i++) {
        new (function (schemaKey) {
            if (typeof schema[schemaKey].type === 'string' && (schema[schemaKey].type === 'password' || (typeof schema[schemaKey].disabled === 'boolean' && schema[schemaKey].disabled) || (typeof schema[schemaKey].hidden === 'boolean' && schema[schemaKey].hidden))) {
                checkpoint();
            } else if (typeof schema[schemaKey].type === 'string' && schema[schemaKey].type === 'model') {
                selectField(schema[schemaKey].model, function (subSelected) {
                    let selectKeys = Object.keys(subSelected);
                    for (let j = 0; j < selectKeys.length; j++) {
                        selected[`${schemaKey}.${selectKeys[j]}`] = subSelected[selectKeys[j]];
                    }
                    checkpoint();
                });
            } else {
                selected[schemaKey] = true;
                checkpoint();
            }
        })(schemaKeys[i]);
    }
};

/**
 * Custom Selected Field
 * @param {*} customObj 
 * @param {*} callback 
 */
let customSelectedField = function (customObj, callback) {
    let objKeys = Object.keys(customObj);
    let selected = {};
    let progress = 0;
    if (objKeys.length === 0) {
        callback(selected);
        return false;
    }
    let checkpoint = function () {
        progress++;
        if (progress < objKeys.length) {
            return false;
        } else {
            callback(selected);
        }
    };
    for (let i = 0; i < objKeys.length; i++) {
        new (function (objKey) {
            if (typeof customObj[objKey] === 'boolean' && customObj[objKey]) {
                selected[objKey] = true;
                checkpoint();
            } else if (typeof customObj[objKey] === 'object') {
                customSelectedField(customObj[objKey], function (subSelected) {
                    let selectKeys = Object.keys(subSelected);
                    for (let j = 0; j < selectKeys.length; j++) {
                        selected[`${schemaKey}.${selectKeys[j]}`] = subSelected[selectKeys[j]];
                    }
                    checkpoint();
                });
            } else {
                checkpoint();
            }
        })(objKeys[i]);
    }
}

let pagebleGet = function (schema, model, size, page) {
    /**
     * get data with executing query
     */
    this.get = function (query, callback, selectedField, sort) {
        if (typeof selectedField === 'string' && selectedField === '*') {
            let selected = {};
            selected['_id'] = false;
            mongo.findWithPageble(model, query, selected, size, page, sort, callback);
        } else if (Array.isArray(selectedField)) {
            let selected = {};
            selected['_id'] = false;
            for (let i = 0; i < selectedField.length; i++) {
                selected[selectedField[i]] = true;
            }
            mongo.findWithPageble(model, query, selected, size, page, sort, callback);
        } else if (typeof selectedField === 'object') {
            customSelectedField(selectedField, function (selected) {
                selected['_id'] = false;
                mongo.findWithPageble(model, query, selected, size, page, sort, callback);
            });
        } else {
            selectField(schema, function (selected) {
                selected['_id'] = false;
                mongo.findWithPageble(model, query, selected, size, page, sort, callback);
            })
        }
    }
}

/**
 * Schema model
 */
module.exports = function (schema, model) {

    /**
     * 
     */
    this.pageble = function (size, page) {
        return new pagebleGet(schema, model, size, page);
    };

    /**
     * Save Data
     */
    this.save = function (data, callback) {
        validateSchema(model, schema, null, data, function (error, exception, updatedData) {
            if (error) {
                callback(error, exception, null);
            } else {
                mongo.insertOne(model, updatedData, function (err, result) {
                    if (err) {
                        error = true;
                        exception = 'database error';
                    } else {
                        delete result.ops[0]['_id'];
                        callback(error, exception, result.ops[0]);
                    }
                });
            }
        });
    };

    /**
     * Update One
     */
    this.updateOne = function(query, data, callback){
        mongo.updateOne(model, query, {$set: data}, callback)
    };


    /**
     * get one
     */
    this.getOne = function (query, callback, selectedField) {
        if (typeof selectedField === 'string' && selectedField === '*') {
            let selected = {};
            selected['_id'] = false;
            mongo.findOne(model, query, selected, callback);
        } else if (Array.isArray(selectedField)) {
            let selected = {};
            selected['_id'] = false;
            for (let i = 0; i < selectedField.length; i++) {
                selected[selectedField[i]] = true;
            }
            mongo.findOne(model, query, selected, callback);
        } else if (typeof selectedField === 'object') {
            customSelectedField(selectedField, function (selected) {
                selected['_id'] = false;
                mongo.findOne(model, query, selected, callback);
            });
        } else {
            selectField(schema, function (selected) {
                selected['_id'] = false;
                mongo.findOne(model, query, selected, callback);
            })
        }
    }

    /**
     * get data with executing query
     */
    this.get = function (query, callback, selectedField) {
        if (typeof selectedField === 'string' && selectedField === '*') {
            let selected = {};
            selected['_id'] = false;
            mongo.find(model, query, selected, callback);
        } else if (Array.isArray(selectedField)) {
            let selected = {};
            selected['_id'] = false;
            for (let i = 0; i < selectedField.length; i++) {
                selected[selectedField[i]] = true;
            }
            mongo.find(model, query, selected, callback);
        } else if (typeof selectedField === 'object') {
            customSelectedField(selectedField, function (selected) {
                selected['_id'] = false;
                mongo.find(model, query, selected, callback);
            });
        } else {
            selectField(schema, function (selected) {
                selected['_id'] = false;
                mongo.find(model, query, selected, callback);
            })
        }
    }

    /**
     * Get All
     */
    this.getAll = function (callback, selectedField) {
        this.get({}, callback, selectedField);
    };

    this.deleteOne = function (query, callback) {
        mongo.deleteOne(model, query, callback);
    }
}