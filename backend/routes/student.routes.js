const express= require('express');
const router = express.Router();

const studentController = require('../controllers/students.controller');
const {uploadSubmission} = require('../middlewares/upload');

const {checkToken} = require('../middlewares/auth.middleware');

const updateController = require('../controllers/update.user.controller');
router.use(checkToken);



router.post('/students/joinGroup', studentController.addStudentByGroup);
router.get('/students/getCourse/:id',studentController.getCourseByGroup);
router.get('/students/getTopic/:id',studentController.getTopicByCourse);
router.get('/students/getMaterial/:id',studentController.getMaterialByTopic);
router.get('/students/downloadMaterial/:id', studentController.downloadMaterial);
router.get('/students/profile', studentController.getDataProfile);
router.post('/students/submissions', (req,res,next)=>{
    uploadSubmission.single('file')(req,res,(err)=>{
        if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'Файл слишком большой! Лимит: 50 МБ.' });
                }
                return res.status(400).json({ message: err.message });
            }
            next();
    })
},studentController.createSubmission);

router.get('/students/getSubmissions', studentController.getMySubmissions);
router.get('/students/getSubmissionsByTopic/:id', studentController.getMySubmissionsByTopic);

router.delete('/students/deleteSubmissions', studentController.deleteMySubmissions );

router.put('/students/updateProfile', updateController.updateStudentProfile);
module.exports = router;