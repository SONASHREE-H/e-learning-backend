const NotesFilesModel = require('../models/notes-files-model')
const TopicModel = require('../models/topic-model')

const notesFilesControllerObj = {}



// instructor can add multiple notes inside a topic based on topicId => insert notes record into db
notesFilesControllerObj.createNotes = async (request, response) => {
    try{
        const {topicId} = request.params
        const filesArr = request.files
        const {userObj} = request

        console.log('filesArr', filesArr)

        const topicObjFromDB = await TopicModel.findOne({_id: topicId, userInstructorId: userObj.userId}) // find topic based on _id(topicId) & userInstructorId

        if(topicObjFromDB === null) // if topic not found for this instructor
        {
            response.status(403).json({
                errors: 'Topic access denied for this instructor'
            })
        }
        else // if topic is found for this instructor -> then add notes into db
        {
            const resultArr = filesArr.map((fileObj) => { // converting array of objects to array of objects(concised) => filesArr to resultArr
                const bodyObj = {}
                bodyObj.notesTitle = fileObj.fieldname // creating notesTitle, fileAssetUrl, topicId, userInstructorId properties inside bodyObj object
                bodyObj.fileAssetUrl = fileObj.filename
                bodyObj.topicId = topicId,
                bodyObj.userInstructorId = userObj.userId
    
                console.log('bodyObj', bodyObj)
                
                return bodyObj
            })
            
            console.log('resultArr', resultArr)
        
            // const insertedNotesFilesObjIntoDB = await NotesFilesModel.create(resultArr) // (OR) use insertManuy() method

            const insertedNotesFilesObjIntoDB = await NotesFilesModel.insertMany(resultArr)
    
            response.json({
                message: 'inserted note into db',
                insertedNotesFilesObjIntoDB: insertedNotesFilesObjIntoDB
            })
        }
    }
    catch(e){ // error in inserting notes obj into db
        response.status(404).json(e)
    }
}








// instructor can update a note based on noteId
notesFilesControllerObj.updateNote = async (request, response) => {
    try{
        const {noteId} = request.params
        const {body, userObj, file} = request // request has file property

        console.log('body', body) // from form-data
        console.log('file', file) // from form-data

        const noteObjFromDB = await NotesFilesModel.findOne({_id: noteId, userInstructorId: userObj.userId})

        if(noteObjFromDB === null) // if record not found
        {
            response.status(403).json({
                errors: 'Note update access denied for this instructor'
            })
        }
        else // if record found -> then update note in db
        {
            let bodyObj = {}

            if('notesTitle' in body)
            {
                bodyObj.notesTitle = body.notesTitle
            }

            if(file) // => file is not undefined i.e, file is uploaded
            {
                bodyObj.fileAssetUrl = file.filename
            }

            console.log('bodyObj', bodyObj)

            if(Object.keys(bodyObj). length > 0) // => if bodyObj is not empty -> then update note in db
            {
                const updatedNoteObjFromDB = await NotesFilesModel.findOneAndUpdate(
                    {_id: noteId, userInstructorId: userObj.userId},
                    bodyObj,
                    {new: true, runValidators: true}
                )

                response.json({
                    message: 'updated note in db',
                    updatedNoteObjFromDB: updatedNoteObjFromDB
                })
            }
            else // if bodyObj is empty -> then return original note
            {
                const originalNoteObjFromDB = await NotesFilesModel.findOne({_id: noteId, userInstructorId: userObj.userId})
                response.json({
                    message: 'original note obj in db',
                    originalNoteObjFromDB: originalNoteObjFromDB
                })
            }

            
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}








// instructor can delete a note based on noteId inside particular topic
notesFilesControllerObj.deleteNote = async (request, response) => {
    try{
        const {noteId} = request.params
        const {userObj} = request

        const noteObjFromDB = await NotesFilesModel.findOne({_id: noteId, userInstructorId: userObj.userId})

        if(noteObjFromDB === null) // if no record found
        {
            response.status(403).json({
                errors: 'Note delete access denied for this instructor'
            })
        }
        else // if record found -> then delete note
        {
            const deletedNoteObjFromDB = await NotesFilesModel.findOneAndDelete({_id: noteId, userInstructorId: userObj.userId})
            response.json({
                message: 'deleted note record in db',
                deletedNoteObjFromDB: deletedNoteObjFromDB
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}






// on FE, if not paid yet, disable note links
// list all the notes under a particular topic based on topicId
notesFilesControllerObj.listNotes = async (request, response) => {
    try{
        const {topicId} = request.params

        const allNotesOfTopicFromDB = await NotesFilesModel.find({topicId: topicId})

        if(allNotesOfTopicFromDB.length === 0) // if empty array returned
        {
            response.json({
                message: 'No notes found for this topic',
                allNotesOfTopicFromDB: allNotesOfTopicFromDB
            })
        }
        else // array.length > 0
        {
            response.json({
                message: 'list of notes for this topic',
                allNotesOfTopicFromDB: allNotesOfTopicFromDB
            })
        }
    }
    catch(e){
        response.status(404).json(e)
    }
}

module.exports = notesFilesControllerObj