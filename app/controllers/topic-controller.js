const pick = require('lodash/pick')

const TopicModel = require('../models/topic-model')
const CourseModel = require('../models/course-model')
const { findById } = require('../models/user-model')

const topicControllerObj = {}



// instructor can create a topic inside a particular course
topicControllerObj.createTopic = async (request, response) => {
    try{
        const {courseId} = request.params
        const {body} = request
        const {userObj} = request 

        const courseObjFromDB = await CourseModel.findOne({_id: courseId, userInstructorId: userObj.userId}) 

        if(courseObjFromDB === null) // if course record not found
        {
            response.status(404).json({
                errors: 'Course access denied for this instructor'
            })
        }
        else // if course is found -> then create topic
        {
            const bodyObj = pick(body, ['title'])

            bodyObj.courseId = courseId // creating courseId property inside bodyObj object
            bodyObj.userInstructorId = userObj.userId // creating userInstructorId property inside bodyObj object

            const insertedTopicObjIntoDB = await TopicModel.create(bodyObj)
            response.json({
                message: 'created topic in db',
                insertedTopicObjIntoDB: insertedTopicObjIntoDB
            })
        }
    }   
    catch(e){ 
        response.status(404).json(e)
    }
}








// instructor can update a topic based on topicId of a particular course
topicControllerObj.updateTopic = async (request, response) => {
    try{
        const {topicId} = request.params
        const {userObj} = request


        const {body} = request
        const bodyObj = pick(body, ['title'])
        

        const topicObjFromDB = await TopicModel.findOne({_id: topicId, userInstructorId: userObj.userId}).populate('courseId') // populating to get courseId
        // console.log('t', topicObjFromDB)

        if(topicObjFromDB === null) // if topic record not found in db
        {
            response.status(404).json({
                errors: 'Topic access denied for this instructor'
            })
        }
        else // if topic record found in db -> then update topic
        { 
            const courseId = topicObjFromDB.courseId._id
            const updatedTopicObjFromDB = await TopicModel.findByIdAndUpdate(
                {_id: topicId, courseId: courseId},
                bodyObj, 
                {new: true, runValidators: true}
            )

            response.json({
                message: 'topic record updated in db',
                updatedTopicObjFromDB: updatedTopicObjFromDB
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}







// instructor can delete a topic based on topicId of a particular course
topicControllerObj.deleteTopic = async (request, response) => {
    try{
        const {topicId} = request.params
        const {userObj} = request



        const topicObjFromDB = await TopicModel.findOne({_id: topicId, userInstructorId: userObj.userId}).populate('courseId') // populating to get courseId
        // console.log('t', topicObjFromDB)

        if(topicObjFromDB === null) // if topic record not found in db
        {
            response.status(404).json({
                errors: 'Topic access denied for this instructor'
            })
        }
        else // if topic record found in db -> then delete topic in db
        { 
            const courseId = topicObjFromDB.courseId._id

            const deletedTopicObjFromDB = await TopicModel.findOneAndDelete({_id: topicId, courseId: courseId})

            response.json({
                message: 'topic record deleted in db',
                deletedTopicObjFromDB: deletedTopicObjFromDB
            })
        }

        /*
            when a topic is deleted, all the corresponding notes of this topic should be deleted.
        */
    }
    catch(e){
        response.status(404).json(e)
    }
}








// list all the topics of a particular course based on courseId
topicControllerObj.listTopics = async (request, response) => {
    try{
        const {courseId} = request.params

        const allTopicsOfCourseFromDB = await TopicModel.find({courseId: courseId}) // find all the topics based on courseId

        if(allTopicsOfCourseFromDB.length === 0) // if empty array returned
        {
            response.json({
                message: 'No topics found under this course',
                allTopicsOfCourseFromDB: allTopicsOfCourseFromDB
            })
        }
        else // if array.length > 1 returned
        {
            response.json(allTopicsOfCourseFromDB)
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}

module.exports = topicControllerObj