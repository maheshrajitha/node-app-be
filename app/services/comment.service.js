/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Comment.Service
 */
const uuidv1 = require('uuid/v1');

const logger = require('../logger.app');
const error = require('../error');

const base64Factory = require('../util/base64Factory');
const awsS3 = require('../util/awss3.store');

const commentRepositoy = require('../repositories/post.comment.repository');

const env = process.env;

module.exports = {
    upVote: function(req, res, next) {
        commentRepositoy.getOne({ commentId: req.params.commentId }, function(err, result){
            if (err || result === null) {
                next(new error('post not found', undefined, 400));
            } else {
                if (typeof result.votes != 'undefined' && typeof result.votes.down != 'undefined' && Array.isArray(result.votes.down) && result.votes.down.map(val => val.userId).includes(req.userId)) {
                    result.votes.down = result.votes.down.filter(val => val.userId != req.userId);
                }
                if (typeof result.votes === 'undefined') {
                    result.votes = {
                        up: [{userId: req.userId, date: new Date()}]
                    }
                } else if (typeof result.votes.up != 'undefined' && Array.isArray(result.votes.up) && !result.votes.up.map(val => val.userId).includes(req.userId)) {
                    result.votes.up.push({userId: req.userId, date: new Date()});
                } else if (!Array.isArray(result.votes.up) || result.votes.up.length === 0) {
                    result.votes.up = [{userId: req.userId, date: new Date()}]
                }
                commentRepositoy.updateOne({ commentId: req.params.commentId }, { votes: result.votes }, function(err, updateData) {
                    if (err) {
                        next(new error('updating failed', undefined, 400));
                    } else {
                        result.isUp = true;
                        result.isDown = false;
                        if (typeof result.votes != 'undefined') {
                            let upPoint = (typeof result.votes.up != 'undefined' && Array.isArray(result.votes.up)) ? result.votes.up.length : 0;
                            let downPoint = (typeof result.votes.down != 'undefined' && Array.isArray(result.votes.down)) ? result.votes.down.length : 0;
                            result.points = upPoint - downPoint;
                            delete result.votes;
                        } else {
                            result.points = 0;
                        }
                        res.status(200).json(result);
                    }
                });
            }
        });
    },

    downVote: function(req, res, next) {
        commentRepositoy.getOne({ commentId: req.params.commentId }, function(err, result){
            if (err || result === null) {
                next(new error('post not found', undefined, 400));
            } else {
                if (typeof result.votes != 'undefined' && typeof result.votes.up != 'undefined' && Array.isArray(result.votes.up) && result.votes.up.map(val => val.userId).includes(req.userId)) {
                    result.votes.up = result.votes.up.filter(val => val.userId != req.userId);
                }
                if (typeof result.votes === 'undefined') {
                    result.votes = {
                        down: [{userId: req.userId, date: new Date()}]
                    }
                } else if (typeof result.votes.down != 'undefined' && Array.isArray(result.votes.down) && !result.votes.down.map(val => val.userId).includes(req.userId)) {
                    result.votes.down.push({userId: req.userId, date: new Date()});
                } else if (!Array.isArray(result.votes.down) || result.votes.down.length === 0) {
                    result.votes.down = [{userId: req.userId, date: new Date()}]
                }
                commentRepositoy.updateOne({ commentId: req.params.commentId }, { votes: result.votes }, function(err, updateData) {
                    if (err) {
                        next(new error('updating failed', undefined, 400));
                    } else {
                        result.isUp = false;
                        result.isDown = true;
                        if (typeof result.votes != 'undefined') {
                            let upPoint = (typeof result.votes.up != 'undefined' && Array.isArray(result.votes.up)) ? result.votes.up.length : 0;
                            let downPoint = (typeof result.votes.down != 'undefined' && Array.isArray(result.votes.down)) ? result.votes.down.length : 0;
                            result.points = upPoint - downPoint;
                            delete result.votes;
                        } else {
                            result.points = 0;
                        }
                        res.status(200).json(result);
                    }
                });
            }
        });
    },

    commentsComment: function(req, res, next) {
        let comment = req.body;
        comment.commentId = uuidv1();
        comment.parentId = req.params.commentId;
        comment.parentType = 'comment';
        comment.ownerId = req.userId;
        comment.stat = {
            create: {
                userId: req.userId,
                date: new Date()
            }
        };
        let image = undefined;
        let extention = undefined;
        let path = undefined;
        let imageName = undefined;
        if (typeof comment.media != 'undefined' && typeof comment.media.base64 != 'undefined') {
            if (comment.media.base64.search(/^data:([A-Za-z-+/]+);base64,/) != -1) {
                comment.media.dataType = (comment.media.base64.split(';')[0]).split('/')[1];
            }
            comment.media.base64 = comment.media.base64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
            image = base64Factory.decode(comment.media.base64);
            if (typeof comment.media.mediaType != undefined && typeof comment.media.mediaType === 'video') {
                extention = (typeof comment.media.dataType != 'undefined') ? comment.media.dataType : 'mp4';
                path = 'post/video';
            } else if (typeof comment.media.mediaType != undefined && typeof comment.media.mediaType === 'gif') {
                extention = (typeof comment.media.dataType != 'undefined') ? comment.media.dataType : 'gif';
                path = 'post/gif';
            } else {
                extention = (typeof comment.media.dataType != 'undefined') ? comment.media.dataType : 'png';
                path = 'post/image';
            }
            imageName = `${comment.commentId}.${extention}`;
            comment.media = {
                link: `https://ep-store.s3.us-east-2.amazonaws.com/${path}/${imageName}`
            };
        }
        commentRepositoy.getOne({ commentId: req.params.commentId }, function(pcommentErr, pcomment){
            if (!pcommentErr && pcomment != null) {
                if (typeof pcomment.commentsCount === 'undefined') {
                    pcomment.commentsCount = 1;
                } else {
                    pcomment.commentsCount++;
                }
                commentRepositoy.save(comment, function(commentErr, commentData){
                    if (!commentErr && comment != null) {
                        awsS3.upload(path, image, imageName);
                        commentRepositoy.updateOne({ commentId: req.params.commentId }, { commentsCount: pcomment.commentsCount }, function(pcommentUpdatingErr, updatedPComment) {
                            if (!pcommentUpdatingErr) {
                                logger.info(`${req.params.commentId} updated`);
                            }
                        });
                        res.status(200).json(comment);
                    } else {
                        next(new error('commenting failed', undefined, 400));
                    }
                })
            } else {
                next(new error('post not found', undefined, 400));
            }
        });
    },


    commentsCommentList: function(req, res, next) {
        let size = 5;
        let page = 0;
        if (typeof req.query['size'] != 'undefined'){
            size = parseInt(req.query['size']);
        }
        if (typeof req.query['page'] != 'undefined') {
            page = parseInt(req.query['page']);
        }
        commentRepositoy.pageble(size, page).get({parentId: req.params.commentId}, function(err, result){
            if (Array.isArray(result)) {
                let comments = [];
                result.forEach(val => {
                    if (typeof req.userId != 'undefined') {
                        val.isUp = (typeof val.votes != 'undefined' && typeof val.votes.up != 'undefined' && Array.isArray(val.votes.up) && val.votes.up.map(val => val.userId).includes(req.userId));
                        val.isDown = (typeof val.votes != 'undefined' && typeof val.votes.down != 'undefined' && Array.isArray(val.votes.down) && val.votes.down.map(val => val.userId).includes(req.userId));
                    } else {
                        val.isUp = false;
                        val.isDown = false;
                    }
                    if (typeof val.votes != 'undefined') {
                        let upPoint = (typeof val.votes.up != 'undefined' && Array.isArray(val.votes.up)) ? val.votes.up.length : 0;
                        let downPoint = (typeof val.votes.down != 'undefined' && Array.isArray(val.votes.down)) ? val.votes.down.length : 0;
                        val.points = upPoint - downPoint;
                        delete val.votes;
                    } else {
                        val.points = 0;
                    }
                    comments.push(val);
                });
                res.status(200).json(comments);
            } else {
                res.status(200).json(result);
            }
        });
    }
}