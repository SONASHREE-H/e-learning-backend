const validator = require('validator')
const bcryptjs = require('bcryptjs') 
const pick = require('lodash/pick') // importing only pick() method from lodash package
const jwt = require('jsonwebtoken')

const UserModel = require('../models/user-model')

const sendEmailFn = require('../helpers/nodemailer')

const userControllerObj = {}



// register user => store user object into database
userControllerObj.register = async (request, response) => {
    console.log('inside user reg')
    try{
        const {body} = request
        // console.log('body', body) /// body { username: 'learner1', email: 'learner1@gmail.com', password: 'secret123', role: 'learner' }
        // console.log(typeof body) /// object


        // sanitizing user inputs:
        const bodyObj = pick(body, ['username', 'email', 'password', 'role'])
        // console.log('bodyObj', bodyObj) /// bodyObj { username: 'learner9', email: 'learner9@gmail.com', password: 'Secret123#', role: 'learner' }
        // console.log(typeof bodyObj) /// object
        console.log('role', body.role) // if role not provided from frontend, here role is undefined. during db insertion db set to learner(default value)


        const isValidEmail = validator.isEmail(bodyObj.email) // returns true for valid email, false for invalid email
        // console.log('isValidEmail', isValidEmail)
        

        if(isValidEmail) // if email is valid -> then check for valid password
        {
            const isValidPassword = validator.isStrongPassword(bodyObj.password, {minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1})
            // console.log('isValidPassword', isValidPassword)

            if(isValidPassword) // if password is valid -> create encrypted password for user entered password & store this encrypted password in db. insert user object into database
            {

                const saltValue = await bcryptjs.genSalt()
                // console.log(saltValue, typeof saltValue, saltValue.length) /// $2a$10$mQ.NriRbMzLJ3teOYCnsm. string 29

                const hashedPassword = await bcryptjs.hash(bodyObj.password, saltValue)
                // console.log(hashedPassword, typeof hashedPassword, hashedPassword.length) /// $2a$10$mQ.NriRbMzLJ3teOYCnsm.GnCV4l/TT15zqGIz.GB5SwxSNIE81q2 string 60
                
                

                bodyObj.password = hashedPassword // updating password property inside bodyObj to hashedPassword

                const insertedUserObjFromDB = await UserModel.create(bodyObj)

                // console.log('insertedUserObjFromDB', insertedUserObjFromDB)

                const to = insertedUserObjFromDB.email
                const subject = 'E-learning-platform user register'
                const text = `Hello ${insertedUserObjFromDB.username}, \nWelcome to the E-learning platform. You have successfully registered to the website as ${insertedUserObjFromDB.role}.`

                await sendEmailFn(to, subject, text) // invoking helper function sendEmailFn() by passing these arguments

                response.json(insertedUserObjFromDB)
            }
            else // if password is invalid -> send error message
            {
                response.status(404).json({
                    errors: 'invalid password. Password should be of atleast 8 characters, containing one lowercase, one uppercase, one number, one symbol'
                })
            }
        }
        else // if email is invalid -> send error message
        {
            response.status(404).json({
                errors: 'invalid email format'
            })
        }
    }
    catch(e){ // some error while inserting user object into db
        response.status(404).json(e)
    }

}








// user login => check if user is already existing in db & if passwords match
userControllerObj.login = async (request, response) => {
    try{
        const {body} = request
        const bodyObj = pick(body, ['email', 'password'])

        const userObjFromDB = await UserModel.findOne({email: bodyObj.email}) // get the user from database based on email property

        if(userObjFromDB) // if(user) => user with this email exist in db -> then check if passwords match
        {
            const booleanValue = await bcryptjs.compare(bodyObj.password, userObjFromDB.password) // bodyObj.password is user entered password(in postman).  userObjFromDB.password is hashed password(60 characters)

            if(booleanValue) // if(true) => passwords match -> then generate token (inside which has user's id & role) & send this token
            {
                const tokenData = { // creating tokenData object
                    userId: userObjFromDB._id,
                    role: userObjFromDB.role
                }

                console.log('123', tokenData.userId,  typeof tokenData.userId)

                const token = jwt.sign(tokenData, process.env.JWT_SECRET) // generating token using tokenData & secret key

                response.json({
                    token: token
                })
            }
            else // if(false) => passwords don't match -> then send back error message
            {
                response.status(404).json({
                    errors: 'invalid password'
                })
            }
        }
        else // if(null) => user with this email does not exist in db -> then send back error message
        { 
            response.status(404).json({
                errors: 'invalid email'
            })
        }
    }
    catch(e){ // some error while getting user object from db
        response.status(404).json(e)
    }
}







/*
    if instructor deletes, then delete his account from app. but don't delete the courses bcoz learners have already bought the course. but this instructor will no longer have access to his created courses, topics or notes

    if learner deletes, then delete his account from app. also, he should be removed from all the enrolled courses in this app => remove his id from learners in CourseModel, also remove this learner(user) from profile model
*/
// user(instructor or learner) can delete his account from the app -> remove user record from db
userControllerObj.deleteUser = async (request, response) => {
    try{
        const {userId} = request.params // send userId in request url

        const deletedUserObjFromDB = await UserModel.findByIdAndDelete(userId)

        const to = deletedUserObjFromDB.email
        const subject = 'User account delete'
        const text = `Hello ${deletedUserObjFromDB.username}, \nYour account is successfully deleted from the app. \nYou no longer will have access to the courses you were enrolled in`
        await sendEmailFn(to, subject, text)

        response.json(deletedUserObjFromDB)
    }
    catch(e){ // error in deleting user obj in db
        response.status(404).json(e)
    }
}

module.exports = userControllerObj