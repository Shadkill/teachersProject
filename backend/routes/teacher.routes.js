const express = require('express');
const router = express.Router();
const teacherController = require("../controllers/teacher.controller");
const {uploadMaterial} = require('../middlewares/upload');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.checkToken,authMiddleware.checkTeacher);
router.post('/teacher/createCourse', teacherController.createCourseTeacher);
router.get('/teacher/courses', teacherController.getMyCourses);
router.post('/teachers/coursesAddTeacher',teacherController.addTeacherByCourse);
router.post('/teachers/coursesAddGroup',teacherController.addGroupByCourse);
router.post('/teachers/courses/createTopics', teacherController.addTopicByCourse);
router.get('/teachers/courses/:id', teacherController.getTopicsByCourses)
router.delete('/teachers/courses/deleteTopic/:id', teacherController.deleteTopic);


router.post('/materials', (req,res,next)=>{
    uploadMaterial.single('file')(req,res,(error)=>{
        if(error){
            if(error.code ==='LIMIT_FILE_SIZE'){
                return res.status(400).json({message:"Файл слишком большой! Максимум 50мб!"})
            }
            return res.status(400).json({message:error.message})
        }
        next();
    })
}, teacherController.addMaterialByTopic);

router.delete('/teachers/deleteMaterials/:id', teacherController.deleteMaterial);
router.get('/teachers/getSubmissions/:id', teacherController.getSubmissionsByTopic);
router.get('/teachers/submissionsDownload/:id',teacherController.downloadSubmission)
router.put('/teachers/reviewSubmission', teacherController.reviewSubmissions)
router.get('/teachers/groups', teacherController.getGroupMany);
router.get('/teachers/getAllTeachers', teacherController.getAllTeachers);
module.exports = router;
