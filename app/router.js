/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Router
 */

const express = require('express');

const error = require('./error');
const authorize = require('./auth.user');
const role = require('./role.user');

const users = require('./services/users.service');
const auth = require('./services/auth.service');
const post = require('./services/post.service');
const comment = require('./services/comment.service');
const category = require('./services/category.service');

/** App router */
const router = express.Router();

/** Render Home page of API Service */
router.get('/', function(req, res) {
  res.sendFile(`${__dirname}/html-templates/home.html`);
});

/** Users Routing */
const usersRouter = express.Router();
usersRouter.post('', users.save);
usersRouter.get('/me', authorize([role.admin.key, role.user.key, role.super_admin.key]), users.getMe);
usersRouter.get('', users.getPage);
router.use('/users', usersRouter);

/** Authentication Routing */
const authRouter = express.Router();
authRouter.post('/login', auth.login);
authRouter.delete('/logout', auth.logout);
router.use('/auth', authRouter);

/** Post Routing */
const postRouter = express.Router();
postRouter.post('/', authorize(role.user.key), post.create);
postRouter.get('/', authorize(), post.list);
postRouter.put('/:postId/votes/up', authorize(role.user.key),  post.upVote);
postRouter.put('/:postId/votes/down', authorize(role.user.key),  post.downVote);
postRouter.post('/:postId/comments', authorize(role.user.key),  post.postComment);
postRouter.get('/:postId/comments', authorize(),  post.postCommentList);
router.use('/posts', postRouter);

/** Comment Routing */
const commentRouter = express.Router();
commentRouter.put('/:commentId/votes/up', authorize(role.user.key),  comment.upVote);
commentRouter.put('/:commentId/votes/down', authorize(role.user.key),  comment.downVote);
commentRouter.post('/:commentId/comments', authorize(role.user.key),  comment.commentsComment);
commentRouter.get('/:commentId/comments', authorize(),  comment.commentsCommentList);
router.use('/comments', commentRouter);

/** Category Routing */
const categoryRouter = express.Router();
categoryRouter.post('/', authorize(role.user.key), category.create);
categoryRouter.get('/', authorize(), category.list);
router.use('/categories', categoryRouter);

/** Utilities */
router.get('/countries', function(req, res, next) {
  res.status(200).json(require('./util/countries'));
})

/** All other */
router.all('/**', function (req, res, next) {
  next(new error('page not found', undefined, 404, 404));
});//page not found


module.exports = router