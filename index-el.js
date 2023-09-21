const express = require('express')
const cors = require('cors')


const appObj = express()

appObj.use(cors())
appObj.use(express.json()) // if we don't type this, then request.body from frontend is undefined

const configureDB = require('./config/database')
configureDB()

require('dotenv').config()
// console.log('process.env', process.env) // has all the properties present inside .env file
// console.log(typeof process.env) /// object


// importing controllers
const userControllerObj = require('./app/controllers/user-controller')
const courseControllerObj = require('./app/controllers/course-controller')
const topicControllerObj = require('./app/controllers/topic-controller')
const notesFilesControllerObj = require('./app/controllers/notes-files-controller')
const profileControllerObj = require('./app/controllers/profile-controller')
const paymentControllerObj = require('./app/controllers/payment-controller')
const commentsControllerObj = require('./app/controllers/comments-controller')



// importing middlewares
const authenticateUser = require('./app/middlewares/authenticate-user')
const authorizeUser = require('./app/middlewares/authorize-user')




const multer = require('multer')

// for notes -> manually create a folder called notes-upload-folder
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "notes-upload-folder")
    },
    filename: (req, file, cb) => {
        cb(null, `file-${file.originalname}`)
    }
})

const upload = multer({
    storage: multerStorage
})



// for profile or course image -> manually create a folder called image-folder
const imageMulterStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('p', file)
        cb(null, 'image-folder')
    },
    filename: (req, file, cb) => {
        cb(null, `file-${file.originalname}`)
    }
})


// filtering profile or course image to only be of format .jpg, .jpeg or .png
const imageMulterFilter = (req, file, cb) => {
    console.log('in filter file', file)
    const arr = ['jpg', 'jpeg', 'png']
    const fileType = file.mimetype.split("/")[1]

    if(arr.includes(fileType))
    {
        cb(null, true)
    }
    else 
    {
        cb(new Error('Please upload image in the format .jpg, .jpeg or .png'), false);
    }
  }

const imageUpload = multer({
    storage: imageMulterStorage,
    fileFilter: imageMulterFilter
})




// -----> USER APIs <--------
// register the user => create user record in db
appObj.post('/api/users/register', userControllerObj.register)


// login user => check if user already exists in db based on email & password
appObj.post('/api/users/login', userControllerObj.login)

// user(instructor or learner) can delete his account from the app
appObj.delete('/api/users/delete-user/:userId', authenticateUser, userControllerObj.deleteUser) // user should be logged-in to delete his account









// -----> PROFILE APIs <--------
// since authenticating, no need to pass userId in API
// only that respective user has access to their respective profile

// creating a user profile -> one user has only one profile
appObj.post('/api/users/profile/create-profile', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, profileControllerObj.createProfile) // profile can be created either by instructor or learner


// editing a user profile based on profileId
appObj.put('/api/users/profile/update-profile/:profileId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, imageUpload.single('image'), profileControllerObj.updateProfile) // pass key as profile-image only, otherwise error


// deleting a user profile based on profileId -> not on FE
appObj.delete('/api/users/profile/delete-profile/:profileId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, profileControllerObj.deleteProfile)

// get one user profile based on profileId
appObj.get('/api/users/profile/one-profile/:profileId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, profileControllerObj.getOneProfile)






// ------> COURSE APIs <--------
// instructor can create a course
appObj.post('/api/courses/create-course', authenticateUser, (request, response, next) => { 
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, imageUpload.single('image'), courseControllerObj.createCourse) 



// instructor can delete a course based on courseId
appObj.delete('/api/courses/delete-course/:courseId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, courseControllerObj.deleteCourse) 


// list all the courses based on category -> isPublished = true, isDeleted = false
appObj.get('/api/courses/list-courses', courseControllerObj.listBasedOnCategory) // to see list of courses, user need not login


appObj.put('/api/courses/update-course:courseId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, courseControllerObj.updateCourse) 










// ------> TOPIC APIs <-------
// instructor can create a topic inside a course
appObj.post('/api/courses/topics/create-topic/:courseId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, topicControllerObj.createTopic) 

// instructor can update a topic based on topicId
appObj.put('/api/courses/topics/update-topic/:topicId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, topicControllerObj.updateTopic)

// instructor can delete a topic based on topicId
appObj.delete('/api/courses/topics/delete-topic/:topicId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, topicControllerObj.deleteTopic) 

// list all the topics of a particular course based on courseId
appObj.get('/api/courses/topics/list-topics/:courseId', topicControllerObj.listTopics) // to see list of topics, user need not login












// ------> NOTES FILES APIs <-------
// we should manually create a folder called notes-upload-folder inside backend folder

// instructor can add a note inside a topic based on topicId
appObj.post('/api/courses/topics/notes/create-notes/:topicId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, upload.any(), notesFilesControllerObj.createNotes) 


// instructor can update a note based on noteId
appObj.put('/api/courses/topics/notes/update-note/:noteId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, upload.single('update-noteFile'), notesFilesControllerObj.updateNote) 


// instructor can delete a note based on noteId
appObj.delete('/api/courses/topics/notes/delete-note/:noteId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor']
    next()
}, authorizeUser, notesFilesControllerObj.deleteNote)


// list all the notes under a particular topic based on topicId
appObj.get('/api/courses/topics/notes/list-notes/:topicId', notesFilesControllerObj.listNotes) // to see list of notes, user need not login













// ------> PAYMENT APIs <--------
// learner can buy a course based on courseId -> create orderId
appObj.post('/api/courses/payments/create-order/:courseId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['learner'] // for any instructor to learn a course, sign in with different account as learner
    next()
}, authorizeUser, paymentControllerObj.createOrder)


// verify orderId
appObj.post('/api/courses/payments/verify-order', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['learner']
    next()
}, authorizeUser, paymentControllerObj.verifyOrder)







// -------> COMMENTS APIs <---------
// user can insert a comment under a note based on noteId
appObj.post('/api/notes/comments/create-comment/:noteId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, commentsControllerObj.createComment)


// user can update comment based on commentId
appObj.put('/api/notes/comments/update-comment/:commentId', authenticateUser, (request, response, next) => {
    request.permittedRoles= ['instructor', 'learner']
    next()
}, authorizeUser, commentsControllerObj.updateComment)


// user can delete a comment based on commentId
appObj.delete('/api/notes/comments/delete-comment/:commentId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, commentsControllerObj.deleteComment)


// user can see list of comments under a note
appObj.get('/api/notes/comments/list-comments/:noteId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, commentsControllerObj.listComments)






// -------> COMMENTS REPLIES APIs <--------
// user can reply to a comment based on commentId
appObj.post('/api/notes/comments/replies/create-reply/:commentId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, commentsControllerObj.createReply)


// user can update his reply to a comment based on replyId
appObj.put('/api/notes/comments/replies/update-reply/:replyId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, commentsControllerObj.updateReply) // pass commentId in request.query (params field)


// user can delete his reply to a comment based on replyId
appObj.delete('/api/notes/comments/replies/delete-reply/:replyId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['instructor', 'learner']
    next()
}, authorizeUser, commentsControllerObj.deleteReply) // pass commentId in request.query (params field)






// --------> RATINGS AND REVIEWS APIs <--------
// user can add rating & review to a course based on courseId
appObj.post('/api/courses/reviews/create-review/:courseId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['learner']
    next()
}, authorizeUser, courseControllerObj.createReview)


// user can update rating & review based on reviewId
appObj.put('/api/courses/reviews/update-review/:reviewId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['learner']
    next()
}, authorizeUser, courseControllerObj.updateReview) // pass courseId in request.params


// user can delete rating & review based on reviewId
appObj.delete('/api/courses/reviews/delete-review/:reviewId', authenticateUser, (request, response, next) => {
    request.permittedRoles = ['learner']
    next()
}, authorizeUser, courseControllerObj.deleteReview) // pass courseId in request.params


// user can see all ratings & reviews of a course
appObj.get('/api/courses/reviews/all-reviews/:courseId', courseControllerObj.getAllReviews)

const port = 3050
appObj.listen(port, () => {
    console.log('server is running on port', port)
})