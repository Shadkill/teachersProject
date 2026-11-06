const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');



router.post('/teacher/registration', authController.registerTeacher);
router.post('/teacher/login', authController.loginTeacher);
router.post('/teacher/getToken', authController.verifyTeacherToken);
router.post('/student/registration',authController.registerStudent);
router.post('/student/login',authController.loginUser);
router.post('/student/getToken',authController.verifyStudentToken);
module.exports = router;