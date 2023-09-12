/*
const multer = require('multer')

const profileUpload = (request, response, next) => {
    const multerStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "profile-image-folder")
        },
        filename: (req, file, cb) => {
            cb(null, `file-${file.originalname}`)
        }
    })
    
    
    const multerFilter = (req, file, cb) => {
        if (file.mimetype.split("/")[1] === "pdf") 
        {
            cb(null, true)
        } 
        else 
        {
            cb(new Error("Not a PDF File!!"), false);
        }
    }
    
    const upload = multer({
        storage: multerStorage,
        fileFilter: multerFilter
    })
}


module.exports = profileUpload
*/
    
