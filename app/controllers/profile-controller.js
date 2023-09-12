const ProfileModel = require('../models/profile-model')

const profileControllerObj = {}

// creating a user profile -> one user has only one profile
profileControllerObj.createProfile = async (request, response) => {
    try{
        const {userObj} = request

        // one user has one profile
        const profileObjFromDB = await ProfileModel.findOne({userId: userObj.userId})

        if(profileObjFromDB === null) // if no profile for this user -> then create profile
        {
            const bodyObj = { // creating bodyObj with userId property
                userId: userObj.userId
            }
            // when user registers, we only display name pre-filled. in update-profile, user can add his image & bio
            
            const insertedProfileObjIntoDB = await ProfileModel.create(bodyObj)
    
            response.json(insertedProfileObjIntoDB)
        }
        else // => already profile exists for this user
        {
            response.status(403).json({
                errors: 'Profile already exists for this user'
            })
        }    
    }
    catch(e){
        response.status(404).json(e)
    }
}




// editing a user profile based on profileId
profileControllerObj.updateProfile = async (request, response) => {
    try{
        const {profileId} = request.params
        const {body, userObj, file} = request // request has file property

        console.log('profile body', body)
        console.log('file', file)

        let bodyObj = {}
        
        if('bio' in body) // if bio key is present in req.body -> then insert biography property inside bodyObj 
        {
            bodyObj.biography = body.bio
        }

        if(file) // if file is uploaded => not undefined -> then insert image property inside bodyObj
        {
            bodyObj.image = file.filename
        }
      
        // console.log('bodyObj', bodyObj)

        if(Object.keys(bodyObj).length > 0) // if bodyObj is not empty -> then update profile in db
        {
            const updatedProfileObjFromDB = await ProfileModel.findOneAndUpdate(
                {_id: profileId, userId: userObj.userId},
                bodyObj,
                {new: true, runValidators: true}
            ) // finding & updating based on profileId & userId


            if(updatedProfileObjFromDB === null) // if null -> then return error message
            {
                response.status(404).json({
                    errors: 'No profile found'
                })
            }
            else // if record found -> return updated record
            {
                response.json({
                    message: 'updated profile record in db',
                    updatedProfileObjFromDB: updatedProfileObjFromDB
                })
            }            
        }
        else // if bodyObj is empty -> then old profileObj in db is returned 
        {
            const originalProfileObjFromDB = await ProfileModel.findOne({_id: profileId, userId: userObj.userId})
            response.json({
                message: 'original profile record in db',
                originalProfileObjFromDB: originalProfileObjFromDB
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}




// deleting a user profile based on profileId -> not on FE, in FE user doesn't have an option to delete hus profile unless user account itself is deleted from app
profileControllerObj.deleteProfile = async (request, response) => {
    try{
        const {profileId} = request.params
        const {userObj} = request

        const deletedObjFromDB = await ProfileModel.findOneAndDelete({_id: profileId, userId: userObj.userId})
        response.json(deletedObjFromDB)
    }
    catch(e){
        response.status(404).json(e)
    }
}



profileControllerObj.getOneProfile = async (request, response) => {
    try{
        const {profileId} = request.params
        const {userObj} = request

        // since one user has one profile, so we can find based on userId itself
        const profileObjFromDB = await ProfileModel.findOne({_id: profileId, userId: userObj.userId})
        response.json(profileObjFromDB)
    }
    catch(e){
        response.status(404).json(e)
    }
}

module.exports = profileControllerObj