const mongoose = require('mongoose')

const {Schema} = mongoose

const profileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        // unique: true // unique not working
    },
    biography: {
        type: String
    },
    image: {
        type: String
    }
}, {timestamps: true})

const ProfileModel = mongoose.model('Profile', profileSchema)

module.exports = ProfileModel