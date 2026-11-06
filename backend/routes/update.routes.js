const express = require('express');

const router = express.Router();

const updateUserController = require('../controllers/update.user.controller');

const middlewares = require('../middlewares/auth.middleware')

router.post('/update/userPasswordStepOne', updateUserController.updatePasswordStepOne);
router.post('/update/userPasswordStepTwo', updateUserController.updatePasswordStepTwo);
router.post('/update/userPasswordStepThree', updateUserController.updatePasswordStepThree);
router.post('/update/studentProfile',middlewares.checkToken, updateUserController.updateStudentProfile);
router.post('/update/teacherProfile',middlewares.checkToken,middlewares.checkTeacher, updateUserController.updateTeacherProfile);


module.exports = router;
