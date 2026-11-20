const prisma = require('../config/prisma');

const path = require('path');
const fs = require('fs');
  const fsPromises = require('fs/promises');
class TeacherController{
    async getGroupMany(req,res,next){
        try {
            const groups = await prisma.group.findMany();
            res.json(groups)
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
        }
    }
    async createCourseTeacher(req,res,next){
        try {
            const { name,description} = req.body;
            const id = req.user.id;
            if(!name){
                return res.status(400).json({message:'Название курса обязательно!'})
            }
            const findTeacher = await prisma.teacher.findUnique({
                where:{
                    id: Number(id)
                }
            }); 
            if(!findTeacher){
                return res.status(404).json({message:'Преподаватель не найден! Создать курс невозможно!'})
            }
            const newCourse = await prisma.course.create({
                data:{
                    name,
                    description,
                    teachers:{
                        connect:{id: Number(id)}
                    }
                }
            });
            return res.status(200).json({message:'Курс успешно создан!', newCourse})
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при создании курса!' });
        }
    }
    async addTeacherByCourse(req,res,next){
        try {
            const {teacherId,courseId} = req.body;
            if(!teacherId||!courseId){
            return res.status(400).json({message:'Не переданы нужные поля!'})

            }
            const findTeacher = await prisma.teacher.findUnique({
                where:{
                    id:Number(teacherId)
                }
            });
            const findCourse = await prisma.course.findUnique({
                where:{
                    id: Number(courseId)
                }
            })
            if(!findCourse||!findTeacher){
                return res.status(404).json({message:"Ошибка, не удалось найти нужные данные!"})
            }
            await prisma.course.update({
                where:{
                    id:Number(courseId),
                },
                data:{
                    teachers:{
                        connect:{id:Number(teacherId)}
                    }
                }
            });
            return res.status(200).json({message:"Преподаватель успешно добавлен на курс!"})
        } catch (error) {
            console.error(error);
            return res.status(500).json({message:"Ошибка сервера! Приносим свои извинения!"})
        }
    }
    async addGroupByCourse(req,res,next){
        try {
            const {groupId,courseId} = req.body;
            if(!groupId||!courseId){
                return res.status(400).json({message:'Не переданы нужные параметры!'});
            }
            const [groupFind, courseFind] = await Promise.all([
            prisma.group.findUnique({
                where:{
                    id:Number(groupId)
                }
            }),
            prisma.course.findUnique({
                where:{
                    id:Number(courseId)
                }
            })
            ])
             
            
            if(!groupFind||!courseFind){
                return res.status(404).json({message:'Группа или курс не найдены!'})
            }
            await prisma.course.update({
                where:{
                    id:Number(courseId)
                },
                data:{
                    groups:{
                        connect: {id:Number(groupId)}
                    }
                }
            });
            return res.status(200).json({message:"Группа успешно добавлена к курсу!"})
        } catch (error) {
            console.error(error);
            return res.status(500).json({message:'Ошибка сервера! Приносим свои извинения!'})
        }
    }
    async addTopicByCourse(req,res,next){
        try {
           
            const {title,description,type,videoUrls,allowSubmission, deadline,courseId} = req.body;
            const teacherId = req.user.id;
            if(!title || !courseId || allowSubmission === undefined){
            return res.status(400).json({message:"Заполните все поля!"})
            }
            let validVideoUrls = [];
            if(videoUrls){
                if(!Array.isArray(videoUrls)){
                    return res.status(400).json({message:'Формат видео не массив!'})
                }
                validVideoUrls = videoUrls;
            }
            const courseCheck = await prisma.course.findFirst({
                where:{
                    id:Number(courseId),
                    teachers:{
                        some:{
                            id:Number(teacherId)
                        }
                    }
                }
            });
            if(!courseCheck){
                return res.status(400).json({message:"Курс не найден или у вас нет доступа к этому курсу!"})
            }
            const obj =['LECTURE', 'CLASSWORK', 'HOMEWORK', 'LAB']
            if(!obj.includes(type)){
                return res.status(400).json({message:'Неверный тип темы!'})
            }
            const newTopic = await prisma.topic.create({
                data:{
                    title,
                    description,
                    type:type,
                    videoUrls: validVideoUrls,
                    allowSubmission:Boolean(allowSubmission),
                    deadline:deadline?new Date(deadline): null,
                    courseId:Number(courseId)
                }
            });
            return res.status(201).json({message:'Тема успешно создана!',topic:newTopic});
        } catch (error) {
            console.error(error);
            return res.status(500).json({message:'Ошибка сервера! Приносим свои извинения!'})
        }
    }
    async addMaterialByTopic(req,res,next){
        try {
            const {topicId} = req.body;
            const teacherId = req.user.id;
            const file = req.file;
            if(!file){
                return res.status(400).json({message:'Файл не загружен или не выбран!'})
            }
            if(!topicId){
                fs.unlinkSync(file.path);
                return res.status(400).json({message:'Нужные данные не переданы!'})
            }
            const topicCheck = await prisma.topic.findFirst({
                where:{
                    id:Number(topicId),
                    course:{
                        teachers:{
                            some:{
                                id:Number(teacherId)
                            }
                        }
                    }
                }
            })
            if(!topicCheck){
                fs.unlinkSync(file.path);
                return res.status(403).json({message:'Тема не найдена!'})
            }
            const originalName = Buffer.from(file.originalname,'latin1').toString('utf8');
            const fileExt = path.extname(originalName).toLowerCase();
            const newMaterial = await prisma.material.create({
                data:{
                    originalFileName:originalName,
                    filePath:file.path,
                    fileSize:file.size,
                    fileExt:fileExt,
                    topicId:Number(topicId)
                }
            });
            return res.status(201).json({
                message:'Материал успешно загружен!',
                material:newMaterial
            })
        } catch (error) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            console.error(error);
            return res.status(500).json({ message: 'Ошибка сервера при сохранении материала!' });
        }
    }
    async getMyCourses(req,res,next){
        try {
            const id = req.user.id;
            const findCourses = await prisma.course.findMany({
                where:{
                    teachers:{
                        some:{
                            id:Number(id)
                        }
                    }
                }
            });
            if(findCourses.length === 0){
                return res.status(200).json({message:'У вас пока нет курсов!'})
            }
            return res.status(200).json({courses:findCourses})
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Ошибка сервера при получении данных!' });
        }
    }
    async getTopicsByCourses(req,res,next){
        try {
            const courseId = req.params.id;
            const id = req.user.id;

            if(!courseId){
                return res.status(400).json({message:'Нужные данные не переданы!'})
            }
            const findCourse = await prisma.course.findFirst({
                where:{
                    id:Number(courseId),
                    teachers:{
                        some:{
                            id:Number(id)
                        }
                    }
                       
                    
                }, include:{
                    teachers:true
                }
            })
            if(!findCourse){
                return res.status(403).json({message:'Курс не найден или у вас нет доступа к этому курсу!'})
            }
            const topic = await prisma.topic.findMany({
                where:{
                    courseId:Number(courseId),
                    course:{
                        teachers:{
                            some:{id:Number(id)}
                        }
                    },
                    
                },include:{
                    materials:{
                        select:{
                            id:true,
                            originalFileName:true,
                            fileExt: true,
                            fileSize:true,
                            createdAt: true
                        }
                    }
                },orderBy:{
                    createdAt:'asc'
                }
            })
            return res.status(200).json({topics:topic})
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Ошибка сервера при получении данных!' });
        }
    }
   async getSubmissionsByTopic(req,res,next){
    try {
        const id = req.user.id;
        const topicId = req.params.id;
        const {status, groupId} = req.query;
        if(!topicId){
                return res.status(400).json({message:'Нужные данные не переданы!'})
            }
            const topicCheck = await prisma.topic.findFirst({
                where:{
                    id:Number(topicId),
                    course:{
                        teachers:{
                            some:{
                                id:Number(id)
                            }
                        }
                    }
                }
            })
            if(!topicCheck){
                return res.status(403).json({message:'У вас нет прав к данным темам!'})
            }
            const whereFilter ={
                topicId: Number(topicId)
            }
            if(status){
                whereFilter.status = status;
            }
            if(groupId){
                whereFilter.groupId = Number(groupId)
            }
        const submissions = await prisma.submission.findMany({
            where:whereFilter,
            include:{
                student:{
                    select:{
                        id:true,
                        email:true,
                        fullName:true,
                       
                    },
                },
                 group:{
                        select:{
                            id:true,
                            name:true,
                            teachers:{
                                select:{
                                    id:true,
                                    fullName:true
                                }
                            }
                            }
                        }
            },orderBy:{
                createdAt:'desc'
            }
        })
        return res.status(200).json({
            topicTitle:topicCheck.title,
            deadline:topicCheck.deadline,
            totalSubmissions: submissions.length,
            submissions
        })
        
    } catch (error) {
        console.error(error);
            return res.status(500).json({ message: 'Ошибка сервера при получении данных!' });
    }
   }
   async downloadSubmission(req,res,next){
    try {
        const id = req.user.id;
        const submissionId=req.params.id;
         if(!submissionId){
                return res.status(400).json({message:'Нужные данные не переданы!'})
            }
         const submission = await prisma.submission.findFirst({
            where:{
                id:Number(submissionId),
                topic:{
                    course:{
                        teachers:{
                            some:{id:Number(id)}
                        }
                    }
                }
                
            },
            
         });
         if(!submission){
            return res.status(404).json({message:'Материал не найден или у вас нет доступа к скачиванию данного материала!'})
         }
         const absolutePath = path.resolve(submission.filePath);
         if(!fs.existsSync(absolutePath)){
            return res.status(404).json({message:"Материал отстуствует на сервере!"})
         }
        return res.download(absolutePath,submission.originalFileName)   
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
    }
   }
   async reviewSubmissions(req,res,next){
    try {
        const id = req.user.id;
        const {teacherComment,status,submissionId} = req.body;
        if(!teacherComment||!status||!submissionId){
            return res.status(400).json({message:'Не переданы нужные данные!'})
        }
        const statusProtected = [
            {name:'ON_REVIEW'},
            {name:'REVIEWED'},
            {name:'REJECTED'}
        ]
            
        const protectedReview = statusProtected.find(pr=> pr.name===status);
        if(!protectedReview){
            return res.status(400).json({message:'Передан неверный статус!'})
        }
        const submissionFind = await prisma.submission.findFirst({
            where:{
                id:Number(submissionId),
                topic:{
                    course:{
                        teachers:{
                            some:{id:Number(id)}
                        }
                    }
                }
            }
           
        })
        if(!submissionFind){
            return res.status(400).json({message:"У вас нет доступа к данному файлу!"})
        }
        const submissionUpdate = await prisma.submission.update({
            where:{
                id:Number(submissionId),
            },
            data:{
                teacherComment:teacherComment,
                status:status
            }
        })
        return res.status(201).json({message:'Обновление данных успешно!'})
    } catch (error) {
         console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при получении данных!' });
    }
   }
   async deleteMaterial(req,res,next){
    try {
        const id = req.user.id;
        const materialId = req.params.id;
        if(!materialId){
            return res.status(400).json({message:'Не переданы нужные данные!'})
            
        }
        const findMaterial = await prisma.material.findFirst({
            where:{
                id:Number(materialId),
                topic:{
                    course:{
                        teachers:{
                            some:{id:Number(id)}
                        }
                    }
                }
            }
        });
        if(!findMaterial){
            return res.status(400).json({message:'Материал не найден или у вас нет доступа к нему!'})
        }
        if(fs.existsSync(findMaterial.filePath)){
            fs.unlinkSync(findMaterial.filePath);
        }
        await prisma.material.delete({
            where:{
                id:Number(materialId)
            }
        });
        return res.status(201).json({
            message:"Материал удалён!"
        })
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({error:'Ошибка сервера приносим свои извинения!'})
    }
   }
   async deleteTopic(req,res,next){
    try {
        const id = req.user.id;
        const topicId = req.params.id;
        if(!topicId){
            return res.status(400).json({message:"Не переданы нужные данные!"})
        }
        const findTopic = await prisma.topic.findFirst({
            where:{
                id:Number(topicId),
                course:{
                    teachers:{
                        some:{
                            id:Number(id)
                        }
                    }
                }
            }
        })
        if(!findTopic){
            return res.status(400).json({message:"Тема не найдена или у вас нет доступа!"})
        }
        const findMaterials= await prisma.material.findMany({
            where:{
                topicId:Number(topicId)
            },
        });
        for(const material of findMaterials){
            if(material.filePath&&fs.existsSync(material.filePath)){
                fs.unlinkSync(material.filePath)
            }
        }
        const submissions = await prisma.submission.findMany({
            where:{
                topicId:Number(topicId)
            }
        });
        for(const sub of submissions){
            if(sub.filePath&&fs.existsSync(sub.filePath)){
                fs.unlinkSync(sub.filePath)
            }
        }
        await prisma.topic.delete({
            where:{
                id:Number(topicId)
            }
        })
        return res.status(201).json({message:'Удаление темы прошло успешно!'})
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Ошибка сервера приносим свои извинения!"})
    }
   }
   async getAllTeachers(req,res,next){
    try {
        const findTeachers = await prisma.teacher.findMany();
        return res.json(findTeachers)
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Ошибка сервера приносим свои извинения!"})
    }
   }
   async updateCourse(req,res,next){
    try {
        const {courseId,name,description} = req.body;
        const id = req.user.id;
        if(!courseId||!name||!description){
            return res.status(400).json({message:"Не переданы нужные данные!"})
        }
        const findCourse = await prisma.course.findFirst({
            where:{
                id:Number(courseId),
                teachers:{
                    some:{
                        id: Number(id)
                    }
                }
            }
        })
        if(!findCourse){
             return res.status(400).json({message:"Курс не найден или у вас нет доступа!"})
        }
        const update = await prisma.course.update({
            where:{
                id:Number(courseId)
            },
            data:{
                name,
                description
            }
        }) 
        return res.status(200).json({message:'Курс успешно обновлён!'})
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Ошибка сервера приносим свои извинения!"})
    }
   }
   async deleteCourse(req,res,next){
    try {
        const {courseId} = req.body;
        const id = req.user.id;
        if(!courseId){
            return res.status(400).json({message:"Не переданы нужные данные!"})
        }
        const findCourse = await prisma.course.findFirst({
            where:{
                id:Number(courseId),
                teachers:{
                    some:{
                        id: Number(id)
                    }
                }
            },include:{
                topics:{
                    include:{
                        materials:true,
                        submissions:true
                    }
                }
            }
        })
        if(!findCourse){
             return res.status(400).json({message:"Курс не найден или у вас нет доступа!"})
        }
        for(const topic of findCourse.topics){
            for(const mat of topic.materials){
                await fsPromises.unlink(path.join(__dirname,'..', mat.filePath)).catch(()=>{})
            }
        }

        for(const topic of findCourse.topics){
            for(const sub of topic.submissions){
                await fsPromises.unlink(path.join(__dirname,'..', sub.filePath)).catch(()=>{})
            }
        }
        await prisma.course.delete({
            where:{
                id:Number(courseId)
            }
        }) 
        return res.status(200).json({message:'Курс успешно удалён!'})
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Ошибка сервера приносим свои извинения!"})
    }
    }
    async unLinkGroup(req,res,next){
        try {
            const {idGroup, idCourse} = req.body;
            const id = req.user.id;
            if(!idGroup||!idCourse){
                return res.status(400).json({message:"Не переданы нужные данные!"})
            }
            const findCourse = await prisma.course.findFirst({
            where:{
                id:Number(idCourse),
                teachers:{
                    some:{
                        id: Number(id)
                    }
                }
            }
        })
        if(!findCourse){
             return res.status(400).json({message:"Курс не найден или у вас нет доступа!"})
        }
        const findGroup = await prisma.group.findFirst({
            where:{
                id:Number(idGroup)
            }
        })
        if(!findGroup){
             return res.status(400).json({message:"Группа не найдена!"})
        }
        await prisma.course.update({
            where:{
                id:Number(idCourse)
            },
            data:{
                groups:{
                    disconnect:{id:Number(idGroup)}
                }
            }
        })
        return res.status(200).json({message:'Группа успешно отвязана!'})
        } catch (error) {
            console.error(error);
        return res.status(500).json({message:"Ошибка сервера приносим свои извинения!"})
        }
    }
    async topicUpdate(req,res,next){
        try {
            const {topicId,title,description,type,videoUrls,allowSubmission, deadline,courseId} = req.body;
            const teacherId = req.user.id;
            if(!title || !courseId || allowSubmission === undefined ||!topicId||!type){
            return res.status(400).json({message:"Заполните все поля!"})
            }
            const findTopic = await prisma.topic.findFirst({
                where:{
                    id: Number(topicId),
                    course:{
                        teachers:{
                            some: {id:Number(teacherId)}
                        }
                    }
                },
                
            })
            if(!findTopic){
                return res.status(400).json({message:"Тема не найдена или у вас нет доступа к этому курсу!"})
            }
            let validVideoUrls = [];
            if(videoUrls){
                if(!Array.isArray(videoUrls)){
                    return res.status(400).json({message:'Формат видео не массив!'})
                }
                validVideoUrls = videoUrls;
            }
            const courseCheck = await prisma.course.findFirst({
                where:{
                    id:Number(courseId),
                    teachers:{
                        some:{
                            id:Number(teacherId)
                        }
                    }
                }
            });
            if(!courseCheck){
                return res.status(400).json({message:"Курс не найден или у вас нет доступа к этому курсу!"})
            }
            const obj =['LECTURE', 'CLASSWORK', 'HOMEWORK', 'LAB']
            if(!obj.includes(type)){
                return res.status(400).json({message:'Неверный тип темы!'})
            }
            const topicUpdate = await prisma.topic.update({
                where:{
                    id:Number(topicId)
                },
                data:{
                     title,
                    description,
                    type:type,
                    videoUrls: validVideoUrls,
                    allowSubmission:Boolean(allowSubmission),
                    deadline:deadline?new Date(deadline): null,
                    courseId:Number(courseId)
                }
            })
            return res.status(200).json({message:"Тема успешно обновлена!"})
        } catch (error) {
             console.error(error);
        return res.status(500).json({message:"Ошибка сервера приносим свои извинения!"})
        }
    }
    async getStudentsByGroup(req,res,next){
        try {
            const userId = Number(req.user.id);
            const groupId = Number(req.params.id);
            if(!groupId||isNaN(groupId)){
                return res.status(400).json({ message: 'Переданы не корректные данные!' });
            }
            const group = await prisma.group.findFirst({
                where:{
                    id:groupId,
                    courses:{
                        some:{
                            teachers:{
                                some:{id:userId}
                            }
                        }
                    }
                },select:{
                    id:true,
                    name:true,
                    students:{
                        where:{
                            isBanned:false
                        },
                        select:{
                            id:true,
                            fullName:true,
                            email:true
                        },
                        orderBy:{
                            fullName:'asc'
                        }
                    }
                }
            })
            if(!group){
                return res.status(403).json({ message: 'Группа не найдена или у вас нет доступа к её списку студентов!' });
            }
            return res.status(200).json({
                groupId: group.id,
                groupName: group.name,
                students: group.students
            });
        } catch (error) {
            console.error(error);
        return res.status(500).json({message:"Ошибка сервера приносим свои извинения!"})
        }
    }
   
}



module.exports = new TeacherController();