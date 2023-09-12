const mongoose = require('mongoose')

const {Schema} = mongoose

const notesFileSchema = new Schema({
    notesTitle: { // eg: video on datatypes, about strings
        type: String,
        required: true
    },
    fileAssetUrl: { // string.pdf, .jpeg
        type: String,
        required: true
    },
    topicId: {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    userInstructorId: { // to check whether an instructor has access to this notes or not
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps: true})

const NotesFilesModel = mongoose.model('NotesFiles', notesFileSchema)

module.exports = NotesFilesModel