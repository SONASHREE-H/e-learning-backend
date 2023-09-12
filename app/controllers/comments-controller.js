const pick = require('lodash/pick')

const CommentsModel = require('../models/comments-model')
const CourseModel = require('../models/course-model')
const NotesFilesModel = require('../models/notes-files-model')
const TopicModel = require('../models/topic-model')
const { result } = require('lodash')

const commentsControllerObj = {}

// user can insert a comment under a note based on noteId. user must be instructor of this course or enrolled in the course to comment
commentsControllerObj.createComment = async (request, response) => {
    try{
        const {noteId} = request.params
        const {body, userObj} = request

        const notesObjFromDB = await NotesFilesModel.findById(noteId).populate('topicId') // populate topicId to get courseId

        const courseId = notesObjFromDB.topicId.courseId

        const courseObjFromDB = await CourseModel.findById(courseId)
        // console.log('c', courseObjFromDB)

        // check if logged-in user is enrolled into this course or not
        const resultLearnerObj = courseObjFromDB.learners.find((learnerObj) => {
            return learnerObj.userLearnerId.toString() === userObj.userId
        })

        if((notesObjFromDB.userInstructorId.toString() === userObj.userId) || resultLearnerObj) // if user is instructor of this course OR an enrolled learner in the course -> then create comment
        {
            const bodyObj = pick(body, ['body'])
            bodyObj.noteId = noteId // adding properties noteId & userId inside bodyObj
            bodyObj.userId = userObj.userId

            const insertedCommentedObjInDB = await CommentsModel.create(bodyObj)

            response.json({
                message: 'inserted comment in db',
                insertedCommentedObjInDB: insertedCommentedObjInDB
            })
        }
        else
        {
            response.status(403).json({
                errors: 'Please enroll in the course to comment'
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}





// user can update comment based on commentId
commentsControllerObj.updateComment = async (request, response) => {
    try{
        const {commentId} = request.params
        const {body, userObj} = request

        const commentObjFromDB = await CommentsModel.findOne({_id: commentId, userId: userObj.userId})
        
        if(commentObjFromDB === null) // if comment record not found in db
        {
            response.status(403).json({
                errors: 'No comment found for this user'
            })
        }
        else // if comment record found -> then update comment
        {
            const bodyObj = pick(body, ['body'])
            
            const updatedCommentObjFromDB = await CommentsModel.findOneAndUpdate(
                {_id: commentId, userId: userObj.userId},
                bodyObj,
                {new: true, runValidators: true}
            )

            response.json({
                message: 'updated comment in db',
                updatedCommentObjFromDB: updatedCommentObjFromDB
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}




// user can delete a comment based on commentId
commentsControllerObj.deleteComment = async (request, response) => {
    try{
        const {commentId} = request.params
        const {userObj} = request

        const commentObjFromDB = await CommentsModel.findOne({_id: commentId, userId: userObj.userId})

        if(commentObjFromDB === null) // if comment record not found
        {
            response.status(403).json({
                errors: 'No comment found for this user'
            })
        }
        else // if comment record found -> then delete comment in db
        {
            const deletedCommentObjFromDB = await CommentsModel.findOneAndDelete({_id: commentId, userId: userObj.userId})

            response.json({
                message: 'deleted comment in db',
                deletedCommentObjFromDB: deletedCommentObjFromDB
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}





// user (only instructor of this course OR enrolled learners) can see list of comments under a note
commentsControllerObj.listComments = async (request, response) => {
    try{
        const {noteId} = request.params
        const {userObj} = request


        const notesObjFromDB = await NotesFilesModel.findById(noteId).populate('topicId') // populate topicId to get courseId

        const courseId = notesObjFromDB.topicId.courseId

        const courseObjFromDB = await CourseModel.findById(courseId)

        // check if logged-in user is enrolled into this course or not
        const resultLearnerObj = courseObjFromDB.learners.find((learnerObj) => {
            return learnerObj.userLearnerId.toString() === userObj.userId
        })

        if((notesObjFromDB.userInstructorId.toString() === userObj.userId) || resultLearnerObj) // if user is instructor of this course OR an enrolled learner in the course -> then list comments
        {
            const allCommentsOfNotesFromDB = await CommentsModel.find({noteId: noteId})

            if(allCommentsOfNotesFromDB.length === 0)
            {
                response.json({
                    message: 'no comments found for this note',
                    allCommentsOfNotesFromDB: allCommentsOfNotesFromDB
                })
            }
            else
            {
                response.json({
                    message: 'list of comments for this note',
                    allCommentsOfNotesFromDB: allCommentsOfNotesFromDB
                })
            }
        }
        else
        {
            response.status(403).json({
                errors: 'Please enroll in the course to view comments'
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}





// user(only instructor of this course OR enrolled learners) can reply to a comment based on commentId
commentsControllerObj.createReply = async (request, response) => {
    try{
        const {commentId} = request.params
        const {body, userObj} = request

        const commentObjFromDB = await CommentsModel.findById(commentId).populate('noteId') // populate noteId to get topicId
        // console.log('c', commentObjFromDB)
        const topicId = commentObjFromDB.noteId.topicId

        const topicObjFromDB = await TopicModel.findById(topicId) // to get courseId
        // console.log('t', topicObjFromDB)

        const courseId = topicObjFromDB.courseId
        const courseObjFromDB = await CourseModel.findById(courseId)
        // console.log('course', courseObjFromDB)


        // check if logged-in user is enrolled into this course or not
        const resultLearnerObj = courseObjFromDB.learners.find((learnerObj) => {
            return learnerObj.userLearnerId.toString() === userObj.userId
        })


        if((commentObjFromDB.userId.toString() === userObj.userId) || resultLearnerObj) // if user is instructor of this course OR an enrolled learner in the course -> then create reply to a comment
        {
            const bodyObj = pick(body, ['body'])
            
            bodyObj.commentId = commentId
            bodyObj.noteId = commentObjFromDB.noteId // adding properties commentId, noteId & userId inside bodyObj
            bodyObj.userId = userObj.userId

            console.log('bodyObj', bodyObj)
            commentObjFromDB.replies.push(bodyObj) // replies is an array
            await commentObjFromDB.save()

            response.json({
                message: 'inserted reply to a comment in db',
                commentObjFromDB: commentObjFromDB
            })
        }
        else
        {
            response.status(403).json({
                errors: 'Please enroll in the course to comment'
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}






// user can update his reply to a comment based on replyId
commentsControllerObj.updateReply = async (request, response) => {
    try{
        const {replyId} = request.params
        const {body, userObj} = request

        // pass commentId in request.query
        const {commentId} = request.query
        const commentObjFromDB = await CommentsModel.findById(commentId)

        // to find reply in repliesArr based on id
        const resultReplyObj = commentObjFromDB.replies.find((replyObj) => {
            return replyId === replyObj._id.toString()
        })

        if(resultReplyObj.userId.toString() === userObj.userId) // if logged-in user is same as person who replied -> then update reply in db
        {
            const bodyObj = pick(body, ['body'])
            
            resultReplyObj.body = bodyObj.body // updating body field in subdoc

            await commentObjFromDB.save() // when we save parent, automatically subdoc is also saved(updated)
            response.json({
                message: 'updated reply to a comment in db',
                commentObjFromDB: commentObjFromDB
            })
        }
        else // if logged-in user not same as person who replied
        {
            response.status(403).json({
                errors: 'Reply not found for this user'
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}






// user can delete his reply to a comment based on replyId
commentsControllerObj.deleteReply = async (request, response) => {
    try{
        const {replyId} = request.params
        const {commentId} = request.query
        const {userObj} = request

        const commentObjFromDB = await CommentsModel.findById(commentId)

        const resultReplyObj = commentObjFromDB.replies.find((replyObj) => {
            return replyObj._id.toString() === replyId
        })

        if(resultReplyObj.userId.toString() === userObj.userId)// if logged-in user is same as person who replied -> then delete reply in db
        {
            const id = resultReplyObj._id
            commentObjFromDB.replies.pull(id) // pull() method removes this document from db
            await commentObjFromDB.save()

            response.json({
                message: 'deleted reply to a comment in db',
                commentObjFromDB: commentObjFromDB
            })
        }   
        else
        {
            response.status(403).json({
                errors: 'Reply not found for this user'
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}

module.exports = commentsControllerObj