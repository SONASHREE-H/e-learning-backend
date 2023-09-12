const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const {Schema} = mongoose

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 128
    },
    role: {
        type: String,
        required: true,
        enum: ['instructor', 'learner'],
        default: 'learner' 
    }
}, {timestamps: true})

userSchema.plugin(uniqueValidator)

const UserModel = mongoose.model('User', userSchema)

module.exports = UserModel

// if same user(learner) wants to start a course, then he should register with different account. => for 1 user account, a user can either be instructor or learner [not both]