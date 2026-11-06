const prisma = require('../config/prisma');
const transporter = require('../config/transporter');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');

class AuthController {
    async registerTeacher(req,res,next){
        try {
            const {email, password,repeatPassword,code, fullName} = req.body;
            if(!email||!password||!fullName||!repeatPassword||!code){
                return res.status(400).json({message:'Заполните все поля!'});
            }
            if(repeatPassword!==password){
                return res.status(400).json({message:'Пароли не совпадают!'})
                
            }
            const teacherFind = await prisma.teacher.findUnique({
                where:{
                    email
                }
            });
            const findUser = await prisma.student.findUnique({
                where:{
                    email
                }
            });
            if(teacherFind||findUser){
                return res.status(400).json({message:'Пользователь с таким email уже существует!'})
            }
            
            const findCode = await prisma.inviteCode.findFirst({
                where:{
                    code:code,
                }
            });
            console.log(findCode)
            if(!findCode){
                return res.status(400).json({message:'Введён неправильный код приглашения!'})
            }
          
            const hashPassword = await bcrypt.hash(password, 10);
            await prisma.teacher.create({
                data:{
                     email,
                passwordHash:hashPassword,
                fullName
                }
               
            });  
            await prisma.inviteCode.delete({
                where:{
                    code:code
                }
            });
            res.status(200).json({message:'Регистрация прошла успешно!'})
        } catch (error) {
            console.error(error);
            return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'})
        }
    }

    async loginTeacher(req,res,next){
        try {
            const {email,password} = req.body;

            if(!email||!password){
                return res.status(400).json({message:'Все поля должны быть заполнены!'})
            }
            const findTeacher = await prisma.teacher.findUnique({
                where:{
                    email
                }
            });
            if(!findTeacher){
                return res.status(400).json({message:'Неверный логин или пароль!'})
            }
            const validPass = await bcrypt.compare(password,findTeacher.passwordHash);
            if(!validPass){
                return res.status(400).json({message:'Неверный логин или пароль!'})
            }
            const code = Math.floor(100000 + Math.random()*900000).toString();
            const expiresAt = new Date(Date.now()+10*60*1000);
            await prisma.teacher.update({
                where:{
                    email
                },
                data:{otpCode:code,otpExpiresAt:expiresAt}
            });
            const htmlFilePath = path.join(__dirname,'../templates/otp.html')
            let htmlContent =await  fs.readFile(htmlFilePath,'utf8');
            htmlContent = htmlContent.replace('{{CODE}}',code)
            const mailOptions = {
                from:process.env.EMAIL,
                to: email,
                subject:'Подтверждение входа',
                html: htmlContent
            }
            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.error('Ошибка при отправки письма', error);
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
    async verifyTeacherToken(req,res,next){
        try {
            const {email,code} = req.body;
            if(!code||!email){
                return res.status(400).json({message:'Введите код!'})
            }
            const findTeacher = await prisma.teacher.findUnique({
                where:{
                    email
                }
            });
            if(!findTeacher||findTeacher.otpCode!== code.trim()){
                return res.status(400).json({message:'Неверный код подтверждения'})
            }

            if(new Date()>new Date(findTeacher.otpExpiresAt)){
                return res.status(400).json({message:'Срок действия кода истёк!'})
            }
            await prisma.teacher.update({
                where:{
                    email
                },
                data:{
                    otpCode: null,
                    otpExpiresAt:null
                }
            })

            const token = jwt.sign({
                id:findTeacher.id, email:findTeacher.email, fullName:findTeacher.fullName, role: findTeacher.role
            },process.env.JWT_SECRET,{
                expiresIn:'15d'
            })
            res.status(200).json({token, message:'Добро пожаловать!'})
        } catch (error) {
             console.error(error);
            return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'})
        }
    }
    async registerStudent(req,res,next){
        try {
            const {fullName,pinCode,repeatPinCode,email} = req.body;
            if(!fullName||!pinCode||!repeatPinCode||!email){
                return res.status(400).json({message:'Заполните все поля!'})
            }
            const findUser = await prisma.student.findUnique({
                where:{
                    email
                }
            });
            const findTeacher = await prisma.teacher.findUnique({
                where:{
                    email
                }
            })
            if(findUser||findTeacher){
                return res.status(400).json({message:'Пользователь с таким email уже существует!'})

            }
            
            if(repeatPinCode!==pinCode){
                return res.status(400).json({message:'Пароли не совпадают!'})
            }
            const hashPassword = await bcrypt.hash(pinCode,10);
            const newUser = await prisma.student.create({
                data:{
                    fullName,
                    pinCode:hashPassword,
                    email
                    
                }
            });
            res.status(200).json({message:'Успешная регистрация!'})
        } catch (error) {
           console.error(error);
            return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'}) 
        }
    }
    async loginUser(req,res,next){
        try {
            const {email,pinCode}  = req.body;
            if(!email||!pinCode){
                return res.status(400).json({message:'Заполните все поля!'})
            }
            const findStudent = await prisma.student.findUnique({
                where:{
                    email
                }
            });
            if(!findStudent){
                return res.status(400).json({message:'Неверный логин или пароль!'})

            }
            const verifyPassword= await bcrypt.compare(pinCode, findStudent.pinCode);
            if(!verifyPassword){
                return res.status(400).json({message:'Неверный логин или пароль!'})

            }
            const code = Math.floor(100000 + Math.random()*900000).toString();
            const expiresAt = new Date(Date.now()+10*60*1000);
            await prisma.student.update({
                where:{
                    email
                },
                data:{
                    otpCode:code,
                    otpExpiresAt:expiresAt
                }
            });
             const htmlFilePath = path.join(__dirname,'../templates/otp.html')
            let htmlContent = await fs.readFile(htmlFilePath,'utf8');
            htmlContent = htmlContent.replace('{{CODE}}',code)
            const mailOptions = {
                from:process.env.EMAIL,
                to: email,
                subject:'Подтверждение входа',
                html: htmlContent
            }
            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.error('Ошибка при отправки письма', error);
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
    async  verifyStudentToken(req,res,next){
         try {
            const {email,code} = req.body;
            if(!code||!email){
                return res.status(400).json({message:'Заполните все поля!'})
            }
            const findStudent = await prisma.student.findUnique({
                where:{
                    email
                }
            });
            if(!findStudent||findStudent.otpCode!== code){
                return res.status(400).json({message:'Неверный код подтверждения'})
            }

            if(new Date()>new Date(findStudent.otpExpiresAt)){
                return res.status(400).json({message:'Срок действия кода истёк!'})
            }
            await prisma.student.update({
                where:{
                    email
                },
                data:{
                    otpCode: null,
                    otpExpiresAt:null
                }
            })

            const token = jwt.sign({
                id:findStudent.id, email:findStudent.email, fullName:findStudent.fullName, role:findStudent.role
            },process.env.JWT_SECRET,{
                expiresIn:'15d'
            })
            res.status(200).json({token, message:'Добро пожаловать!'})
        } catch (error) {
             console.error(error);
            return res.status(500).json({error:'Ошибка сервера, приносим свои извинения!'})
        }
    }
    
}

module.exports = new AuthController();




