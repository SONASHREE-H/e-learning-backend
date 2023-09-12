const mongoose = require('mongoose')

const {Schema} = mongoose

const paymentSchema = new Schema({
    orderId: {
        type: String
    },
    userLearnerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'successful', 'failure']
    },
    paymentDate: {
        type: Date,
        default: new Date()
    }
    /*
    paymentMode: { // we don't get o/p as to whether user paid via debit card or wallet
        type: String,
        enum: ['credit card', 'debit card', 'upi', 'qr', 'netbanking', 'wallet']
    }
    */
}, {timestamps: true})

const PaymentModel = mongoose.model('Payment', paymentSchema)

module.exports = PaymentModel