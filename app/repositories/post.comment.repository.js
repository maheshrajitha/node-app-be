
let location = {
    latitude: { type: 'number' },
    longitude: { type: 'number' }
};

let media = {
    mediaType: { type: 'enum', default: 'image', values: ['image', 'gif', 'video'] },
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

let comment = {
    commentId: { type: 'string', id: true, required: true, unique: true },
    parentId: { type: 'string', required: true },
    parentType: { type: 'enum', required: true, hidden: true, values: ['post', 'comment']  },
    ownerId: { type: 'string', required: true },
    text: { type: 'string' },
    media: { type: 'model', model: media },
    location: { type: 'model', model: location },
    country: { type: 'enum', values: Object.keys(require('../util/countries')) },
    votes: { type: 'model', model: votes, isArray: true },
    commentsCount: { type: 'number', default: 0 },
    status: { type: 'boolean', required: true, default: false },
    stat: { type: 'model', model: require('./shared/stat.model') }
}

module.exports = new (require('../mongo'))(comment, 'post.comment');