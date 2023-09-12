const Razorpay = require('razorpay')
const crypto = require('crypto') // crypto is a built-in module.
const dateFns = require('date-fns')

const PaymentModel = require('../models/payment-model')
const CourseModel = require('../models/course-model')
const UserModel = require('../models/user-model')

const sendEmailFn = require('../helpers/nodemailer')

const paymentControllerObj = {}

// learner can buy a course based on courseId. create orderId & insert it into db
paymentControllerObj.createOrder = async (request, response) => {
    try{
        const {courseId} = request.params
        const {userObj} = request

        const razorpayInstance = new Razorpay({ // creating razorpay instance from Razorpay CF with key_id & key_secret as properties
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })

        
        const courseObjFromDB = await CourseModel.findById(courseId)
        // console.log(courseObjFromDB)

        const optionsObj = { // create optionsObj with following properties
            amount: courseObjFromDB.price * 100, // converting rupees to paise
            currency: 'INR',
            // receipt: crypto.randomBytes(10).toString('hex') // creating a random string with crypto module
            receipt: 'receipt123'
        }

        razorpayInstance.orders.create(optionsObj, async (error, orderObj) => { // to create() method pass 2 args: optionsObj, callbackFn. the callbackFn provides response as either error(on failure) or orderObj(on success)
            if(error) // if error -> then send error message
            {
                response.status(500).json({
                    error: 'Something went wrong'
                })
            }
            else // if no error -> then insert obj into PaymentModel, send email to user
            {
                const bodyObj = { // creating bodyObj
                    orderId: orderObj.id, // orderObj is an object, which has id(i.e, orderId)
                    courseId: courseId,
                    userLearnerId: userObj.userId,
                    status: 'pending',
                }

                const insertedPaymentObjIntoDB = await PaymentModel.create(bodyObj)

                // finding the above inserted object
                const paymentObjFromDB = await PaymentModel.findOne({orderId: insertedPaymentObjIntoDB.orderId}).populate('userLearnerId courseId') // populate userLearnerId to get username, email to send mail notification

                // console.log('i', paymentObjFromDB)

                console.log('normalDate', paymentObjFromDB.paymentDate) /// normalDate 2023-09-07T02:59:57.876Z
                console.log('in string', paymentObjFromDB.paymentDate.toLocaleString()) /// in string 7/9/2023, 8:29:57 am
        
                const paymentLink = `http://localhost:3000/payments/${orderObj.id}` 


                const to = paymentObjFromDB.userLearnerId.email
                const subject = 'Make payment to buy course'
                const text = `Hello ${paymentObjFromDB.userLearnerId.username}, \nPlease use the below link to make paymen to buy course ${courseObjFromDB.name}. \nPayment link - ${paymentLink}`
                await sendEmailFn(to, subject, text) 

                response.json(paymentObjFromDB) 
            }
        })
    }
    catch(e){
        console.log('catch error', e)
        response.status(500).json({ // 500 => Internal Server Error
            errors: 'Internal Server Error'
        })
    }
}




// after payment by user, verify order
paymentControllerObj.verifyOrder = async (request, response) => {
    try{
        const {userObj} = request
        console.log('userObj', userObj)

        const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = request.body // object destructuring from request.body
        /* o/p of request body:
            body: {
                razorpay_payment_id: 'pay_MXWEYV2MkD4Bjs',
                razorpay_order_id: 'order_MXW9Zc13PrKWp9',
                razorpay_signature: '9dd1d0f133eccced974de55f1b9a61fbec3666c050007f45fa10cdbd1e5c1bd9'
            }
        */

        const paymentObjFromDB = await PaymentModel.findOne({orderId: razorpay_order_id, userLearnerId: userObj.userId})
 
        if(paymentObjFromDB === null) // if payment record not found
        {
            response.status(403).json({
                errors: 'Access denied. This order does not belong to this learner'
            })
        }
        else // if payment record found -> then decrypt the signature, update paymentObj, update courseObj[learners]
        {
            const sign = razorpay_order_id + '|' + razorpay_payment_id  // using vertical bar & concatenating them

            // decrypting the signature: 
            let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // Creating hmac object // => SHA256 algorithm

            hmac.update(sign.toString()) // Passing the data to be hashed

            const expectedSign = hmac.digest('hex') // Creating the hmac in the required format

            // (OR)
            /*
            const expectedSign = crypto 
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // SHA256 algorithm
                .update(sign.toString())
                .digest('hex')
            */

            if(razorpay_signature === expectedSign) // => if both signatures match -> then update payment status to completed, change paymentDate. add this learner inside learners array in CourseModel. send payment confirmation mail to user. 
            {
                const bodyObj = {
                    status: 'successful',
                    paymentDate: new Date()
                }

                // console.log(bodyObj.paymentDate)
                // console.log('bodyObj', bodyObj)

                const updatedPaymentObjFromDB = await PaymentModel.findOneAndUpdate(
                    {orderId: razorpay_order_id},
                    bodyObj,
                    {new: true, runValidators: true}
                )
            

                // insert this learner inside learners array of CourseModel
                const courseId = updatedPaymentObjFromDB.courseId.toString() // converting objectId to string
                // console.log('courseId', courseId)

                const courseObjFromDB = await CourseModel.findById(courseId)
                console.log('c', courseObjFromDB)

                const durationArr = courseObjFromDB.duration.split(' ') // split based on 1space // [ '4', 'months' ]

                console.log('updatedPaymentDate', updatedPaymentObjFromDB.paymentDate) /// updatedPaymentDate 2023-09-07T03:18:45.306Z
                console.log('updatedPaymentDate in string', updatedPaymentObjFromDB.paymentDate.toLocaleString()) /// updatedPaymentDate in string 7/9/2023, 8:48:45 am

                // calculating dueDate for a learner from the paymentDate till course duration
                let dueDate
                switch(true)
                {
                    case durationArr[1].includes('hour'): {
                        dueDate = dateFns.addHours(updatedPaymentObjFromDB.paymentDate, durationArr[0]) // addHours(date, 4)
                        break
                    }
                    case durationArr[1].includes('week'): {
                        dueDate = dateFns.addWeeks(updatedPaymentObjFromDB.paymentDate, durationArr[0])
                        break
                    }
                    case durationArr[1].includes('month'): {
                        dueDate = dateFns.addMonths(updatedPaymentObjFromDB.paymentDate, durationArr[0])
                        break
                    }
                    case durationArr[1].includes('year'): {
                        dueDate = dateFns.addYears(updatedPaymentObjFromDB.paymentDate,durationArr[0])
                        break
                    }
                }

                // for free course,dueDate is undefined, then don't add dueDate in learners array
                console.log('dueDate', dueDate) /// dueDate 2024-01-07T03:18:45.306Z
                console.log('dueDate in string', dueDate.toLocaleString()) /// dueDate in string 7/1/2024, 8:48:45 am


    
                const learnerObj = {
                    orderId: razorpay_order_id,
                    userLearnerId: updatedPaymentObjFromDB.userLearnerId, 
                    dueDate: dueDate
                }
                
                // console.log('learnerObj', learnerObj)

                
                
                console.log('arr', courseObjFromDB.learners)
                courseObjFromDB.learners.push(learnerObj) // learners is an array
                await courseObjFromDB.save()
                // console.log('courseObjFromDB', courseObjFromDB)

                const userObjFromDB = await UserModel.findById(userObj.userId) // to get learner's name & email to send mail confirmation
                // console.log('userObjFromDB', userObjFromDB)

                const to = userObjFromDB.email
                const subject= 'Payment confirmed'
                const text = `Hello ${userObjFromDB.username}, \nThis is to confirm that you have paid INR ${courseObjFromDB.price}/- for the course ${courseObjFromDB.name}. The course is valid till ${dueDate.toLocaleString()}. \nHappy learning!. \nThanks`
                await sendEmailFn(to, subject, text)
        
                console.log('payment success')

                response.json(updatedPaymentObjFromDB) 
            }
            else // => if signatures don't match -> send error message
            {
                response.status(404).json({
                    errors: 'Invalid signature sent!'
                })
            }
        }
    }
    catch(e){
        response.status(404).json({
            errors: 'Internal Server Error'
        })
    }
}

module.exports = paymentControllerObj