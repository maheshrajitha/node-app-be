module.exports = {
    /**
     * Base 64 Encode
     * @param {*} bitmap 
     */
    encode: function(bitmap) {
        return new Buffer(bitmap).toString('base64');
    },

    /**
     * Decode to bitmap
     * @param {*} base64str 
     */
    decode: function(base64str) {
        return new Buffer(base64str, 'base64');
    }
}

