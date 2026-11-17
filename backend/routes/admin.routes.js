const express = require('express');
const router = express.Router();
const adminController= require('../controllers/admin.controller');
const adminMiddleware = require('../middlewares/auth.middleware');
const {adminAuthLimiter} = require('../middlewares/rateLimit.middleware')
const middlewear = require('../middlewares/admin.middleware')

router.post('/admin/verifyMasterGate',adminAuthLimiter, adminController.verifyCodeAdmin)
router.post('/admin/login',adminAuthLimiter, middlewear, adminController.codeLoginAdmin);
router.post('/admin/verifyCode',adminAuthLimiter, adminController.verifyAdminToken);

const protectAdmin = [adminMiddleware.checkToken, adminMiddleware.checkAdmin];
router.post('/admin/groupCreate',protectAdmin, adminController.createGroup);
router.post('/admin/addTeacherByGroup', protectAdmin, adminController.addTeacherByGroup);
router.post('/admin/createInviteCode', protectAdmin, adminController.createInviteCode);
router.delete('/admin/deleteInviteCode/:id', protectAdmin, adminController.deleteInviteCode);
router.get('/admin/getAllGroups', protectAdmin, adminController.getAllGroups);
router.get('/admin/getTeachers', protectAdmin,adminController.getAllTeachers);
router.get('/admin/getStudents', protectAdmin,adminController.getAllStudents);
router.put('/admin/banStudents',protectAdmin,adminController.banStudents);
router.put('/admin/unBanStudents', protectAdmin,adminController.unBanStudent);
router.delete('/admin/deleteStudents', protectAdmin,adminController.deleteStudent);
router.put('/admin/freezeTeacher', protectAdmin, adminController.freezeTeacher);
router.put('/admin/unFreezeTeacher',protectAdmin,adminController.unFreezeTeacher);
module.exports = router;
