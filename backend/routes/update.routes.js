const express = require('express');

const router = express.Router();

const updateUserController = require('../controllers/update.user.controller');
const AuthLimiter = require('../middlewares/rateLimit.middleware')
const middlewares = require('../middlewares/auth.middleware')

router.post('/update/userPasswordStepOne',AuthLimiter.userAuthLimiter, updateUserController.updatePasswordStepOne);
router.post('/update/userPasswordStepTwo',AuthLimiter.userAuthLimiter, updateUserController.updatePasswordStepTwo);
router.post('/update/userPasswordStepThree',AuthLimiter.userAuthLimiter, updateUserController.updatePasswordStepThree);
router.post('/update/studentProfile',middlewares.checkToken, updateUserController.updateStudentProfile);
router.post('/update/teacherProfile',middlewares.checkToken,middlewares.checkTeacher, updateUserController.updateTeacherProfile);


module.exports = router;
