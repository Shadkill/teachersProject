const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const path =require('path');
const fs = require('fs/promises')
const transporter =require('../config/transporter');




class AdminController{


    async  createInviteCode(req,res,next){
        try {
            const {code} = req.body;
            if(!code){
                return res.status(400).json({message:'Введите новый inviteCode!'});
            }
            const findCode = await prisma.inviteCode.findUnique({
                where:{
                    code:code
                }
            });
            
            if(findCode){
                return res.status(400).json({message:'Данный код уже существует!'})
            }
           
            await prisma.inviteCode.create({
                data:{
                    code
                }
            });

            return res.status(200).json({message:'Новый код приглашения добавлен!'})
            

        } catch (error) {
            console.error(error);
            return res.status(500).json({message:'Ошибка сервера! Приносим свои извинения!'})
        }
    }
    async deleteInviteCode(req,res,next){
        try {
            const id = Number(req.params.id);
            if(!id||isNaN(id)){
                return res.status(400).json({message:"Не передан id кода!"})
            }
            const findCode = await prisma.inviteCode.findUnique({
                where:{
                   id 
                }
            })
            if(!findCode){
                return res.status(400).json({message:'Не удалось найти код!'});
            }
            await prisma.inviteCode.delete({
                where:{
                    id
                }
            });
                return res.status(200).json({message:"Удаление прошло успешно!"})
            
        } catch (error) {
            console.error(error);
            return res.status(500).json({message:'Ошибка сервера! Приносим свои извинения!'})
        }
    }
    async createGroup(req,res,next){
        try {
            const {name,description, inviteCode} = req.body;
            if(!name||!description||!inviteCode){
                return res.status(400).json({message:'Введите все поля!'});
            }
            const newGroup = await prisma.group.create({
                data:{
                    name,
                    description,
                    inviteCode
                }
            });
            if(!newGroup){
                return res.status(400).json({message:'Не удалось создать группу!'});
            }
            res.status(201).json({message:'Группа успешно создана!'});
        } catch (error) {
            console.error(error);
            return res.status(500).json({message:'Ошибка сервера! Приносим свои извинения!'})
        }
    }
    async addTeacherByGroup(req,res,next){
        try {
            const {groupId, teacherId} = req.body;
            if(!groupId||!teacherId){
                return res.status(400).json({message:'Не переданы нужные значения!'});
            }
            const [teacherFind, groupFind] = await Promise.all([
                 prisma.teacher.findUnique({
                    where:{
                        id:Number(teacherId)
                    }
                }),
                prisma.group.findUnique({
                    where:{
                        id:Number(groupId)
                    }
                })
            ]);

            if(!teacherFind||!groupFind){
                return res.status(400).json({message:'Группы или преподователя не существует!'});
            }
            await prisma.group.update({
                where:{
                    id:Number(groupId)
                },data:{
                    teachers:{connect:{id:Number(teacherId)}}
                }
            });
            res.status(200).json({message:'Преподаватель успешно привязан к группе!'})
        } catch (error) {
            console.error(error);
            return res.status(500).json({message:'Ошибка сервера! Приносим свои извинения!'})
        }
    }
    async verifyCodeAdmin(req,res,next){
        try {
            const {verifyCodeAdmin} = req.body;
            if(!verifyCodeAdmin){
                return res.status(400).json({message:'Введите код!'})
            }
            const code = process.env.SECRET_CODE_ADMIN;
            if(verifyCodeAdmin!==code){
                return res.status(400).json({message:'Неверный код!'})
            }
            const token = jwt.sign({
                gatePassed:true,
                scope:'admin_gate_access'
            }, process.env.JWT_SECRET,{
                expiresIn:'5m'
            });

            return res.status(200).json({message:'Код введён успешно!', token:token})
        } catch (error) {
            console.error(error);
            return res.status(500).json({message:'Ошибка сервера приносим свои извинения!'})
        }
    }
  async codeLoginAdmin(req,res,next){
    try {
        const {email,password} = req.body;
        if(!email||!password){
            return res.status(400).json({message:'Введены не все данные!'});
        }
        const findAdmin = await prisma.admin.findFirst({
            where:{
                email
            }
        });
       

        if(!findAdmin){
            return res.status(404).json({message:'Пользователь не найден или неверный пароль!'})
        } 
        
        const passwordDecoded = await bcrypt.compare( password,findAdmin.password);
        if(!passwordDecoded){
            return res.status(403).json({message:'Пользователь не найден или неверный пароль!'})

        }

        const code =Math.floor(100000+Math.random()*900000).toString();
        const expiresAt = new Date(Date.now()+5*60*1000);
        await prisma.admin.update({
            where:{
                email
            },data:{
                otpCode:code,
                otpExpiresAt:expiresAt
            }
        });
        const htmlFilePath = path.join(__dirname,'../templates/otp.html');
        let htmlContent = fs.readFile(htmlFilePath,'utf8');
        htmlContent = htmlContent.replace('{{CODE}}', code);
        const mailOptions ={
            from: process.env.EMAIL,
            to:email,
            subject:'Подтверждение входа',
            html:htmlContent
        }
        transporter.sendMail(mailOptions,(error,info)=>{
            if(error){
                console.error('Ошибка при отправке письма!');
                return res.status(500).json({message:'Ошибка отправки письма, приносим свои извинения!'})
            }
            console.log('Письмо отправлено');
                return res.status(200).json({message:"Код отправлен на вашу почту!"})
        })


    } catch (error) {
        console.error(error);
        return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'})
    }
}
async verifyAdminToken(req,res,next){
    try {
        const {code,email} =req.body;
        if(!code||!email){
                return res.status(400).json({message:'Введите код!'})
            }
             const findAdmin = await prisma.admin.findUnique({
                where:{
                    email
                }
            });
            if(!findAdmin||findAdmin.otpCode!== code.trim()){
                return res.status(400).json({message:'Неверный код подтверждения'})
            }
            if(new Date()>new Date(findAdmin.otpExpiresAt)){
                return res.status(400).json({message:'Срок действия кода истёк!'})
            }
            await prisma.admin.update({
                where:{
                    email,
                },data:{
                    otpCode:null,
                    otpExpiresAt:null
                }
            });
            const token = jwt.sign({
                id:findAdmin.id, email:findAdmin.email,role,role:findAdmin.role
            },process.env.JWT_SECRET,{
                expiresIn:'1h'
            });
            return res.status(200).json({message:'Все проверки пройдены! Вы авторизованы!',token:token})
    } catch (error) {
        console.error(error);
            return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'})
    }
}
async getAllGroups(req,res,next){
    try {
        const {name} = req.query;
        const groups = await prisma.group.findMany({
            where: name? {
                name:{
                    contains:name,
                    mode:'insensitive'
                }
            }:{}
        });
        return res.status(200).json(groups)
    } catch (error) {
        console.error(error);
            return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'})
    }
}

async getAllTeachers(req,res,next){
    try {
        const {name} = req.query;
        const teachers = await prisma.teacher.findMany({
            where: name ?{
                fullName:{
                    contains:name,
                    mode:'insensitive'
                }
            }:{}
        });
        return res.status(200).json(teachers);
    } catch (error) {
        console.error(error);
            return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'})
    }
}
async getAllStudents(req,res,next){
    try {
        const {name} = req.query;
        const students = await prisma.student.findMany({
            where: name?{
               fullName:{
                contains:name,
                mode:'insensitive'
               } 
            }:{}
        });
        return res.status(200).json(students);
    } catch (error) {
        console.error(error);
            return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'})
    }
}

    
}
  
module.exports = new AdminController();
