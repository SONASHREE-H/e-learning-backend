## user-model
    username
    email
    password
    role: ['instructor', 'learner']

## course-model
    name
    description
    duration
    category
    price: ['development', 'marketing', 'business', 'others']
    userInstructorId
    isPublished
    isDeleted
    learners: [{userId, orderId, dueDate}, {}, {}]
    ratingsAndReviews: [{userId, rating, reviewBody}, {}, {}]

## topic-model
    title
    courseId
    userInstructorId
    
## notes-model
    notesTitle
    fileAssetUrl
    topicId
    userInstructorId

## comments-model
    userLearnerId
    topicId
    body
    replies: [{userId, topicId, body}, {}, {}]

## profile-model
    userId
    biography
    image

## payment-model
    userLearnerId
    orderId
    courseId
    status
    paymentMode