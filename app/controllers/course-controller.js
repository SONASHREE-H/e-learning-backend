const pick = require('lodash/pick')

const CourseModel = require('../models/course-model')

const courseControllerObj = {}




// instructor can create a course => create course record in db
courseControllerObj.createCourse = async (request, response) => {
    try{
        const {body, userObj, file} = request
        console.log('course body', body) // send both body & file via form-data in postman
        console.log('course file', file)

        // console.log('userObj', userObj) /// userObj { userId: '64eefa0697e15d6300359a9b', role: 'instructor' }

        const bodyObj = pick(body, ['name', 'description', 'duration', 'category', 'price'])

        if(file) // if file is not undefined, then create image property to bodyObj
        {
            bodyObj.image = file.filename
        }

        bodyObj.userInstructorId = userObj.userId // creating a property userInstructorId inside bodyObj object & setting its value as userObj.userId. where userObj is obtained from authenticateUser

        const insertCourseObjIntoDB = await CourseModel.create(bodyObj)
        response.json({
            message: 'course created in db',
            insertCourseObjIntoDB: insertCourseObjIntoDB
        })
    }
    catch(e){
        response.status(404).json(e)
    }
}







// instructor can delete a course based on courseId. if course is already published, so don't delete from db bcoz other users are still going through this course. just update isDeleted field to true
courseControllerObj.deleteCourse = async (request, response) => {
    try{
        const {courseId} = request.params
    
        const {userObj} = request

        const courseObjFromDB = await CourseModel.findOne({_id: courseId, userInstructorId: userObj.userId})

        if(courseObjFromDB === null) // if course record not found
        {
            response.status(404).json({
                errors: 'No course found'
            })
        }
        else // if course record found -> then check if course is published or not
        {
            if(courseObjFromDB.isPublished === true) 
            {
                const bodyObj = {
                    isDeleted: true
                }
                
                const delUpdateObjFromDB = await CourseModel.findOneAndUpdate(
                    {_id: courseId, userInstructorId: userObj.userId},
                    bodyObj,
                    {new: true, runValidators: true}
                )

            
                response.json({
                    message: 'updated isDeleted field to true',
                    delUpdateObjFromDB: delUpdateObjFromDB
                })
            }
            else // => course is not yet published, so can be deleted from db
            {
                const deletedCourseObjFromDB = await CourseModel.findOneAndDelete({_id: courseId, userInstructorId: userObj.userId})
                response.json({
                    message: 'delete course record in db',
                    deletedCourseObjFromDB: deletedCourseObjFromDB
                })
            } 
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}






// list all the courses based on category -> isPublished = true, isDeleted = false
courseControllerObj.listBasedOnCategory = async (request, response) => {
    try{
        console.log('request.query', request.query) /// request.query { category: 'development' }  // pass in params
        const queryObj = request.query

        const allCoursesBasedOnCategory = await CourseModel.find(queryObj) // finds all courses in the db based on the category. we are passing object to find() method

        if(allCoursesBasedOnCategory.length === 0)
        {
            response.json({
                message: 'No course found in this category',
                allCoursesBasedOnCategory: allCoursesBasedOnCategory
            })
        }
        else
        {
            response.json({
                message: 'listing courses based on category',
                allCoursesBasedOnCategory: allCoursesBasedOnCategory
            })
        }
    }
    catch(e){
        response.status(404).json({
            errors: 'Error in getting course from db'
        })
    }
}




/*
    should course be updated after learner buys, bcoz name, description, category can be updated. but what about duration, price? maybe he wants to extend duration?
*/

// updating fields: name, description, duration, category, price
courseControllerObj.updateCourse = async (request, response) => {
    try{
        const {courseId} = request.params

        const {body, userObj, file} = request // we get userObj in request bcoz of authenticateUser (tokenData)


        const courseObjFromDB = await CourseModel.findOne({_id: courseId, userInstructorId: userObj.userId})
        console.log('courseObjFromDB', courseObjFromDB)

        if(courseObjFromDB.userInstructorId.toString() === userObj.userId) // if course belongs to this user, allow access
        {
            if(courseObjFromDB.isDeleted) // if course is deleted -> then send this message
            {
                response.status(403).json({
                    errors: 'This course is no longer available!'
                })
            }
            else // if course is not deleted, check whether course is published or not
            {
                if(courseObjFromDB.isPublished) // if course is published -> then ins can update only name, description, image, category
                {
                    const bodyObj = pick(body, ['name', 'description', 'category'])

                    if(file) // if file is uploaded => not undefined
                    {
                        bodyObj.image = file.filename // creating image property inside bodyObj
                    }

                    const updatedCourseObjFromDB = await CourseModel.findOneAndUpdate( // finds course based on courseId and userInstructorId & updates it
                        {_id: courseId, userInstructorId: userObj.userId}, 
                        bodyObj, 
                        {new: true, runValidators: true}
                    )

                    response.json({
                        message: 'course updated after published. isPublished = true',
                        updatedCourseObjFromDB: updatedCourseObjFromDB
                    })
                }
                else // => course is not published -> then ins can update all fields like: name, description, duration, category, image, price
                {
                    const bodyObj = pick(body, ['name', 'description', 'category', 'price', 'duration'])

                    if(file)
                    {
                        bodyObj.image = file.filename
                    }

                    const updatedCourseObjFromDB = await CourseModel.findOneAndUpdate( // finds course based on courseId and userInstructorId & updates it
                        {_id: courseId, userInstructorId: userObj.userId}, 
                        bodyObj, 
                        {new: true, runValidators: true}
                    )

                    response.json({
                        message: 'course updated before published. isPublished = false',
                        updatedCourseObjFromDB: updatedCourseObjFromDB
                    })
                }
            }
        }
        else // => course doesn't belong to this user
        {
            response.status(403).json({
                errors: 'Course Update access denied'
            })
        }

        

        

        

        if((courseObjFromDB.isDeleted === false) && (courseObjFromDB.isPublished === false)) // if course is not deleted and if course is not published -> then he can update course fields: name, description, duration, category, price, image        {
        {
            
        }
        else // => course is deleted i.e, courseObjFromDB = true
        {
            response.status(403).json({
                errors: 'This course is no longer available!'
            })
        }
    }
    catch(e){ // error in updating course obj in db
        response.status(404).json(e)
    }
}








// user(only enrolled learner) can add rating & review to a course. one learner can only create one review per course
courseControllerObj.createReview = async (request, response) => {
    try{
        const {courseId} = request.params
        const {body, userObj} = request

        const courseObjFromDB = await CourseModel.findById(courseId)
        // console.log(courseObjFromDB.learners) // is an array

        // find if logged-in user is enrolled in course or not
        const resultLearnerObj = courseObjFromDB.learners.find((learnerObj) => {
            return learnerObj.userLearnerId.toString() === userObj.userId // convert ObjectId to string to compare
        })


        if(resultLearnerObj === undefined) // learnerObj not found, so undefined returned => not enrolled in course
        {
            response.status(403).json({
                errors: 'Please enroll in the course to add rating & review'
            })
        }
        else // => learnerObj found => enrolled in course -> so, check if review is already added by this learner or not
        {
            // check already a review is added by this user or not
            const resultReviewObj = courseObjFromDB.ratingsAndReviews.find((reviewObj) => {
                return reviewObj.userLearnerId.toString() === userObj.userId
            })

            if(resultReviewObj) // already review is added by user
            {
                response.status(403).json({
                    errors: 'Review is already added by this user for this course'
                })
            }
            else // if review doesn't exist for this user -> create review in db
            {
                const bodyObj = pick(body, ['rating', 'reviewBody'])

                bodyObj.userLearnerId = userObj.userId // creating userLearnerId property inside bodyObj

                courseObjFromDB.ratingsAndReviews.push(bodyObj) // push bodyObj into ratingsAndReviews array
                await courseObjFromDB.save()

                response.json({
                    message: 'inserted rating & review in db',
                    courseObjFromDB: courseObjFromDB
                })
            } 
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}






// user(only enrolled learner) can update rating & review based on reviewId
courseControllerObj.updateReview = async (request, response) => {
    try{
        // pass courseId in request query
        const {reviewId} =  request.params
        const {courseId} = request.query
        const {body, userObj} = request

    
        const courseObjFromDB = await CourseModel.findById(courseId)

        // if both reviewId & userLearnerId match, then only update
        const resultReviewObj = courseObjFromDB.ratingsAndReviews.find((reviewObj) => {
            return (reviewObj._id.toString() === reviewId) && (reviewObj.userLearnerId.toString() === userObj.userId) // convert ObjectId to string to compare
        })

        // console.log('c', resultRatingObj)

        if(resultReviewObj === undefined) 
        {
            response.status(404).json({
                errors: 'Review not found'
            })
        }
        else // if both reviewId & userLearnerId match, then only update
        {
            const bodyObj = pick(body, ['rating', 'reviewBody'])

            // console.log('bodyObj', bodyObj)
            if('rating' in bodyObj) // if rating key in bodyObj -> then insert rating property inside resultReviewObj
            {
                resultReviewObj.rating = bodyObj.rating
            }

            if('reviewBody' in bodyObj) // if reviewBody key in bodyObj -> then insert reviewBody property inside resultReviewObj
            {
                resultReviewObj.reviewBody = bodyObj.reviewBody
            }
            
            // console.log('r', resultRatingObj)

            const updatedCourseReviewObjInDB = await courseObjFromDB.save() // we call save() method on parent, not on subdocument.  also we can store this in a variable
            response.json({
                message: 'rating & review updated in db',
                updatedCourseReviewObjInDB: updatedCourseReviewObjInDB
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}






// user can delete rating & review based on reviewId
courseControllerObj.deleteReview = async (request, response) => {
    try{
        const {reviewId} = request.params
        const {courseId} = request.query
        const {userObj} = request

        const courseObjFromDB = await CourseModel.findById(courseId)

        // check if both reviewId & userId match
        const resultReviewObj = courseObjFromDB.ratingsAndReviews.find((reviewObj) => {
            return (reviewObj._id.toString() === reviewId) && (reviewObj.userLearnerId.toString() === userObj.userId)
        })


        if(resultReviewObj) // if obj returned -> then delete object in db
        {
            const id = resultReviewObj._id
            courseObjFromDB.ratingsAndReviews.pull(id) // pull() method removes the object in db based on id
            await courseObjFromDB.save()

            response.json({
                message: 'deleted rating & review for a course in db',
                courseObjFromDB: courseObjFromDB
            })
        } 
        else // if undefined
        {
            response.status(404).json({
                errors: 'Review not found'
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}






// user can see all ratings & reviews of a particular course
courseControllerObj.getAllReviews = async (request, response) => {
    try{
        const {courseId} = request.params

        const courseObjFromDB = await CourseModel.findById(courseId)

        if(courseObjFromDB.ratingsAndReviews.length === 0) // if length = 0 => no reviews
        {
            response.json({
                message: 'No reviews found for this course',
                'courseObjFromDB.ratingsAndReviews': courseObjFromDB.ratingsAndReviews // since . is a special character, pass property in a string
            })
        }
        else
        {
            response.json({
                message: 'all reviews for this course',
                'courseObjFromDB.ratingsAndReviews': courseObjFromDB.ratingsAndReviews
            })
        }   
    }
    catch(e){
        response.status(404).json(e)
    }
}

module.exports = courseControllerObj