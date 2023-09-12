const mongoose = require('mongoose')

const {Schema} = mongoose

const topicSchema = new Schema({
    title: { // eg: Datatypes
        type: String,
        required: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userInstructorId : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps: true})

const TopicModel = mongoose.model('Topic', topicSchema)

module.exports = TopicModel