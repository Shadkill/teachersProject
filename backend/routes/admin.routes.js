const express = require('express');
const router = express.Router();
const adminController= require('../controllers/admin.controller');
const adminMiddleware = require('../middlewares/auth.middleware');
router.post('/admin/createInviteCode', adminMiddleware.checkAdmin, adminController.createInviteCode);
router.delete('/admin/deleteInviteCode', adminMiddleware.checkAdmin, adminController.deleteInviteCode);


module.exports = router;
