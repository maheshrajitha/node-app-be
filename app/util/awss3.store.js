const AWS = require('aws-sdk');
const logger = require('../logger.app');

const s3 = new AWS.S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_ID,
    }
});

module.exports = {
    upload: function(path, image, imageName) {
        var base64data = new Buffer(image, 'binary');
        s3.putObject({
            Bucket: `ep-store/${path}`,
            Key: imageName,
            Body: base64data,
            ACL: 'public-read'
        }, function (resp) {
            logger.info(`Image Uploading Response : ${resp}`);
        });
    }
}