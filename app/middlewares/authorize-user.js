const authorizeUser = (request, response, next) => {
    if(request.permittedRoles.includes(request.userObj.role))
    {
        next()
    }
    else
    {
        response.status(403).json({
            errors: 'Access denied'
        })
    }
}

module.exports = authorizeUser