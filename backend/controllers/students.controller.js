const path = require('path');
const fs = require('fs')
const prisma = require('../config/prisma');

class  StudentController{
    async addStudentByGroup(req,res,next){
        try {
            const {inviteCode} =req.body;
            const id = req.user.id;
            if(!inviteCode){
                return res.status(400).json({message:'Введите правильный код группы!'})
            }
            const findGroup = await prisma.group.findUnique({
                where:{
                    inviteCode
                }
            });
            if(!findGroup){
                return res.status(404).json({message:'Группа не найдена!'});
            }
            const updateStudent = await prisma.student.update({
                where:{
                    id:Number(id)
                },data:{
                    groupId:findGroup.id
                }
            })
           
            res.status(200).json({message:'Вы успешно добавлены в группу!'})
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при добавлении студента в группу!' });
        }
    }
    async getCourseByGroup(req,res,next){
        try {
            const id = req.user.id;
            const groupId = req.params.id
            if(!groupId){
                return res.status(400).json({message:'Не переданы нужные данные!'})
            }
            const findGroup = await prisma.group.findFirst({
                where:{
                    id:Number(groupId),
                    students:{some:{id:Number(id)}}
                },
            })
            if(!findGroup){
                return res.status(403).json({message:'Группа не найдена или у вас нет группы!'})
                
            }
            const courses = await prisma.course.findMany({
                where:{
                    groups:{some:{id:Number(groupId)}}
                },
                include:{
                    teachers:true
                }
            })
            if(courses.length===0){
            return res.status(404).json({message:'Курсы у данной группы не найдены!'})

            }
            res.status(200).json(courses);


        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
    async getTopicByCourse(req,res,next){
        try {
            const id = req.user.id;
            const courseId = req.params.id;
            if(!courseId){
                return res.status(400).json({message:'Не переданы нужные данные!'})

            }
            const courseFind = await prisma.course.findFirst({
                where:{
                    id:Number(courseId),
                    groups:{
                        some:{
                            students:{
                                some:{id:Number(id)}
                            }
                        }
                    }
                },include:{
                    topics:true
                }
            });
            if(!courseFind){
                return res.status(404).json({message:'Курс не найден!'})
            }
            res.status(200).json(courseFind.topics);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
    async getMaterialByTopic(req,res,next){
        try {
            const topicId = req.params.id;
            const studentId = req.user.id;
            if(!topicId){
                return res.status(400).json({message:'Не переданы нужные данные!'})
            }
            const topicCheck = await prisma.topic.findFirst({
                where:{
                    id:Number(topicId),
                    course:{
                        groups:{
                            some:{
                                students:{
                                    some:{id:Number(studentId)}
                                }
                            }
                        }
                    }
                }
            });
            if(!topicCheck){
                return res.status(400).json({message:'Тема не найдена или у вас нет доступа!'})
            }
            const materials = await prisma.material.findMany({
                where:{
                    topicId:Number(topicId),
                },select:{
                    id:true,
                    originalFileName:true,
                    fileExt:true,
                    fileSize:true
                }
            })
            return res.status(200).json(materials)
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
    async downloadMaterial(req,res,next){
        try {
            const materialId =req.params.id;
            const studentId = req.user.id;
            if(!materialId){
                return res.status(400).json({message:'Не переданы нужные данные!'})

            }
            const material = await prisma.material.findFirst({
                where:{
                    id: Number(materialId),
                    topic:{
                        course:{
                            groups:{
                                some:{
                                    students:{
                                        some:{id:Number(studentId)}
                                    }
                                }
                            }
                        }
                    }
                }
            })
            if(!material){
                return res.status(404).json({message:'Материал не найден или у вас нет доступа к скачиванию данного материала!'})

            }
            const absolutePath = path.resolve(material.filePath);
            if(!fs.existsSync(absolutePath)){
                return res.status(404).json({message:'Материал отстуствует или удалён!'})
                
            }
            return res.download(absolutePath,material.originalFileName,(err)=>{
                if(err){
                    console.error('Ошибка при скачивании файла:',err);
                }
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
    async getDataProfile(req,res,next){
        try {
            const id = req.user.id;
            const findUser = await prisma.student.findUnique({
                where:{
                    id:Number(id)
                },select:{
                    group:true,
                    submissions:true,
                }
            })
            if(!findUser){
                return res.status(404).json({message:'Данные не найдены!'})
            }
            res.status(200).json({user:findUser})
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
    async createSubmission(req,res,next){
        try {
            const {topicId} = req.body;
            const userId = req.user.id;
            const file = req.file;
            if(!file){
                return res.status(400).json({message:"Загрузка файла обязательна!"})
            }
            if(!topicId){
                return res.status(400).json({message:"Не переданы нужные данные!"})

            }
            const findTopic = await prisma.topic.findFirst({
                where:{
                    id:Number(topicId),
                    course:{
                        groups:{
                            some:{
                                students:{
                                    some:{id:Number(userId)}
                                }
                            }
                        }
                    }
                }
            })
            if(!findTopic){
                fs.unlinkSync(file.path);
                return res.status(400).json({message:"Тема не найдена или у вас нет доступа!"})

            }
            if(!findTopic.allowSubmission){
                fs.unlinkSync(file.path);
                return res.status(400).json({ message: 'Для данной темы сдача работ не предусмотрена!' });
            }
            const student = await prisma.student.findFirst({
                where:{
                    id:Number(userId),
                    
                },select:{
                    groupId:true
                }
            })
            if(!student||!student.groupId){
                fs.unlinkSync(file.path);
                return res.status(400).json({ message: 'Вы не состоите в группе! Сдача работ зарещена!' });
            }
            let isLate = false;

            if(findTopic.deadline){
                const currentTime = new Date();
                const deadlineTime = new Date(findTopic.deadline)
                if(currentTime>deadlineTime){
                    isLate = true
                }
            } 
            const originalName = Buffer.from(file.originalname, 'latin1').toString("utf8");
            const ext = path.extname(originalName).toLowerCase();
            const existingSubmission = await prisma.submission.findFirst({
                where:{
                    
                        topicId:Number(topicId),
                        studentId: Number(userId)
                    
                }
            })
            if(existingSubmission){
                if (fs.existsSync(existingSubmission.filePath)) {
                    fs.unlinkSync(existingSubmission.filePath);
                }
                const submissionStudent = await prisma.submission.update({
                    where:{
                        id:existingSubmission.id
                    }, data:{
                        
                        originalFileName: originalName,
                        filePath: file.path,
                        fileSize: file.size,
                        fileExt: ext,
                        isLate: isLate,
                        status: 'ON_REVIEW', 
                        teacherComment: null 
                
                    }
                })
                return res.status(200).json({
                    message: 'Работа успешно обновлена и отправлена на повторную проверку!',
                    submission: submissionStudent
                });
            }
            const newSubmission = await prisma.submission.create({
                data: {
                    originalFileName: originalName,
                    filePath: file.path,
                    fileSize: file.size,
                    fileExt: ext,
                    isLate: isLate,
                    topicId: Number(topicId),
                    groupId: student.groupId,
                    studentId: Number(userId)
                }
            });

            return res.status(201).json({
                message: 'Домашняя работа успешно отправлена!',
                submission: newSubmission
            });
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при отправке работы!' });
        }
    }
    async getMySubmissions(req,res,next){
        try {
            const id= req.user.id;
            const submissions = await prisma.submission.findMany({
                where:{
                    studentId: Number(id)
                }, include:{
                    topic:{
                        select:{
                            id: true,
                            title:true,
                            type: true,
                            deadline:true
                        }
                    }
                }, orderBy:{
                    createdAt:'desc'
                }
            });
            return res.status(200).json(submissions);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
    async getMySubmissionsByTopic(req,res,next){
        try {
            const id = req.user.id;
            const topicId = req.params.id;
            if(!topicId){
                return res.status(400).json({message:'Не переданы нужные данные!'})
            }
            const submissions = await prisma.submission.findUnique({
                where:{
                    topicId_studentId:{
                        topicId:Number(topicId),
                        studentId:Number(id)    
                    }
                    
                }
            });
            if(!submissions){
                return res.status(200).json({
                    submitted:false,
                    message:'Вы пока не сдали работу по этой теме!'
                })
            }
            res.status(200).json({
                submitted: true,
                submissions
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
    async deleteMySubmissions(req,res,next){
        try {
            const id = req.user.id;
            const {submissionId} = req.body;
            if(!submissionId){
                return res.status(400).json({message:'Не переданы нужные данные!'})

            }
            const subFind = await prisma.submission.findFirst({
                where:{
                    id: Number(submissionId),
                    studentId:Number(id)
                }
            });
            if(!subFind){
                return res.status(404).json({message:"Работа не найдена удалить невозможно!"})
            }
            if(subFind.status==='REVIEWED'){
                return res.status(404).json({message:"Работа проверена! Удаление невозможно!"})

            }
            if(fs.existsSync(subFind.filePath)){
                fs.unlinkSync(subFind.filePath)
            }
            await prisma.submission.delete({
                where:{
                    id:Number(submissionId),

                }
            })
            return res.status(201).json({
                message:"Файл удалён!"
            })

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
}

module.exports = new StudentController();