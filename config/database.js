const mongoose = require('mongoose')

const configureDB = async () => {
    try{
        const dbResponse = await mongoose.connect('mongodb://127.0.0.1:27017/e-learning-project')
        console.log('connected to db')
    }
    catch(e){
        console.log('error in connecting to db', e)
    }
}

module.exports = configureDB