const mongoose = require('mongoose')

const {Schema} = mongoose


const learnersSchema = new Schema({
    orderId: { // from razorpay, order_8767thgfdghv
         type: String // no need of required bcoz this comes after payment, also course can be free. so no orderId for free courses
    },
    userLearnerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dueDate: { // by when the course should be completed. if lifetime access for courses, then no need for dueDate
        type: Date
    }
}, {timestamps: true})






const ratingReviewsSchema = new Schema({
    userLearnerId: { // learner who has enrolled to this course can only give rating&review
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    reviewBody: {
        type: String
    }
}, {timestamps: true})





const courseSchema = new Schema({
    name: { // eg: JavaScript
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['development', 'marketing', 'cooking', 'others'],
        required: true
    },
    price: {
        type: Number,
        min: 0, // there can be free course
        default: 0
    },
    userInstructorId: { // let field name be userInstructorId, since for this course he is instructor
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    image: {
        type: String
    },
    learners: [learnersSchema], // learners are array of objects => learners of this course 
    ratingsAndReviews: [ratingReviewsSchema] // ratingsAndReviews are array of objects
}, {timestamps: true})

const CourseModel = mongoose.model('Course', courseSchema)

module.exports = CourseModel