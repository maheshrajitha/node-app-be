/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Post.Repository
 */

let location = {
    latitude: { type: 'number' },
    longitude: { type: 'number' }
};

let media = {
    mediaType: { type: 'enum', default: 'image' , values: ['image', 'gif', 'video']},
    link: { type: 'string' }
};

let vote = {
    userId: { type: 'string' },
    date: { type: 'date' }
};

let votes = {
    up: { type: 'model', model: vote },
    down: { type: 'model', model: vote }
}

let post = {
    postId: { type: 'string', id: true, required: true, unique: true },
    ownerId: { type: 'string', required: true },
    title: { type: 'string', required: true },
    category: { type: 'string', required: true, isArray: true },
    media: { type: 'model', model: media },
    location: { type: 'model', model: location },
    country: { type: 'enum', values: Object.keys(require('../util/countries')), required: true },
    votes: { type: 'model', model: votes, isArray: true },
    commentsCount: { type: 'number', default: 0 },
    status: { type: 'boolean', required: true, default: false },
    stat: { type: 'model', model: require('./shared/stat.model') }
};

module.exports = new (require('../mongo'))(post, 'post');