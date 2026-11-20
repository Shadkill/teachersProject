const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const AuthLimiter = require('../middlewares/rateLimit.middleware')


router.post('/teacher/registration', authController.registerTeacher);
router.post('/teacher/login',AuthLimiter.userAuthLimiter, authController.loginTeacher);
router.post('/teacher/getToken', AuthLimiter.userAuthLimiter,authController.verifyTeacherToken);
router.post('/student/registration',authController.registerStudent);
router.post('/student/login', AuthLimiter.userAuthLimiter, authController.loginUser);
router.post('/student/getToken', AuthLimiter.userAuthLimiter,authController.verifyStudentToken);
module.exports = router;