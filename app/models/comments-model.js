const mongoose = require('mongoose')

const {Schema} = mongoose

const repliesSchema = new Schema({
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comments',
        required: true
    },
    noteId: {
        type: Schema.Types.ObjectId,
        ref: 'NotesFiles',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    body: {
        type: String,
        required: true
    }
}, {timestamps: true})


const commentsSchema = new Schema({
    noteId: {
        type: Schema.Types.ObjectId,
        ref: 'NotesFiles',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    body: {
        type: String,
        required: true
    },
    replies: [repliesSchema]
}, {timestamps: true})

const CommentsModel = mongoose.model('Comments', commentsSchema)

module.exports = CommentsModel