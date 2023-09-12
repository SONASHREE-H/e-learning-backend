const jwt = require('jsonwebtoken')

// routing-level middleware function
const authenticateUser = (request, response, next) => {
    const token = request.headers['x-auth'] // get the token from request headers

    if(token) // if(some string) -> then check if the token is proper or not(modified)
    {   
        try // if(proper token provided) -> then decrypt the token .... // jwt.verify() method throws RunTime Error if token is expired or modified. to prevent our application from crashing have a try-catch block
        {
            const tokenData = jwt.verify(token, process.env.JWT_SECRET) 
            // console.log('tokenData', tokenData) /// tokenData { userId: '64e8bd4b9d215ee9b43ee0d6', role: 'learner', iat: 1693028512 }


            // modifying request object, adding userObj property which is an object. inside which has userId property whose value is tokenData.userId and role property whose value is tokenData.role
            request.userObj = {
                userId: tokenData.userId,
                role: tokenData.role
            }
            
            next() // invoking next function after authenticateUser() in index-pcu.js

            // tokenData is available inside token. token is generated when user logs in
        }
        catch(e) // if(token is modified) -> then send back error message, invalid token
        {
            response.status(401).json({ // 401 is unauthorized HTTP response
                errors: 'invalid token'
            })
        }
    }
    else // if('') => if(empty string) -> then send back error message, token not provided
    {
        response.status(401).json({ // 401 is unauthorized user => lacks valid credentials
            errors: 'token not provided'
        })
    }
}

module.exports = authenticateUser