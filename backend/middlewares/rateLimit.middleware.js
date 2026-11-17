const rateLimit = require('express-rate-limit');

const adminAuthLimiter = rateLimit({
    windowMs:15*60*1000,
    max:5,
    message:{message:'Слишком много попыток! Подождите 15 минут.'},
    standardHeaders:true,
    legacyHeaders:false
});

const userAuthLimiter = rateLimit({
    windowMs:10*60*1000,
    max:10,
    message:{message:'Слишком много попыток! Подождите 10 минут.'},
    standardHeaders:true,
    legacyHeaders:false
})
module.exports ={
    adminAuthLimiter,
    userAuthLimiter
}