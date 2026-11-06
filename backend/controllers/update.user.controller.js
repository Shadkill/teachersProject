const prisma = require("../config/prisma");
const transporter = require("../config/transporter");
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');

class UserController {

    

    async updatePasswordStepOne(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Заполните все поля!' });
            }

            const findUser = await prisma.student.findUnique({ where: { email } });
            const findTeacher = await prisma.teacher.findUnique({ where: { email } });

            if (!findUser && !findTeacher) {
                return res.status(400).json({ message: 'Пользователя с таким email не существует!' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            if (findUser) {
                await prisma.student.update({
                    where: { email },
                    data: { otpCode: code, otpExpiresAt: expiresAt }
                });
            } else if (findTeacher) {
                await prisma.teacher.update({
                    where: { email },
                    data: { otpCode: code, otpExpiresAt: expiresAt }
                });
            }

            const htmlFilePath = path.join(__dirname, '../templates/updatePass.html');
            let htmlContent = await fs.readFile(htmlFilePath, 'utf8');
            htmlContent = htmlContent.replace('{{CODE}}', code);

            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Смена пароля',
                html: htmlContent
            };

           await transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Ошибка при отправке письма', error);
                    return res.status(500).json({ message: 'Ошибка отправки письма, приносим свои извинения!' });
                }
                
                return res.status(200).json({ message: "Код отправлен на вашу почту!" });
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера, приносим свои извинения!' });
        }
    }

    async updatePasswordStepTwo(req, res, next) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ message: 'Заполните все поля!' });
            }

            const findUser = await prisma.student.findUnique({ where: { email } });
            const findTeacher = await prisma.teacher.findUnique({ where: { email } });

            if (!findUser && !findTeacher) {
                return res.status(400).json({ message: 'Пользователя с таким email не существует!' });
            }

            const targetUser = findUser || findTeacher;

            if (targetUser.otpCode !== code || new Date() > new Date(targetUser.otpExpiresAt)) {
                return res.status(400).json({ message: 'Неверный код или срок действия кода истёк!' });
            }

            return res.status(200).json({ message: 'Код верный!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера, приносим свои извинения!' });
        }
    }

    async updatePasswordStepThree(req, res, next) {
        try {
            const { email, code, newPassword } = req.body;
            if (!email || !code || !newPassword) {
                return res.status(400).json({ message: 'Заполните все поля!' });
            }

            const findUser = await prisma.student.findUnique({ where: { email } });
            const findTeacher = await prisma.teacher.findUnique({ where: { email } });

            if (!findUser && !findTeacher) {
                return res.status(400).json({ message: 'Пользователя с таким email не существует!' });
            }

            const targetUser = findUser || findTeacher;

            if (targetUser.otpCode !== code || new Date() > new Date(targetUser.otpExpiresAt)) {
                return res.status(400).json({ message: 'Неверный код или срок действия кода истёк!' });
            }

            const hashPass = await bcrypt.hash(newPassword, 10);

            if (findUser) {
                await prisma.student.update({
                    where: { email },
                    data: {
                        pinCode: hashPass,
                        otpCode: null,
                        otpExpiresAt: null
                    }
                });
            } else if (findTeacher) {
                await prisma.teacher.update({
                    where: { email },
                    data: {
                        passwordHash: hashPass,
                        otpCode: null,
                        otpExpiresAt: null
                    }
                });
            }

            return res.status(200).json({ message: 'Пароль успешно изменён!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера, приносим свои извинения!' });
        }
    }



    async updateStudentProfile(req, res, next) {
        try {
            const { fullName, email, pinCode } = req.body;
            const id = req.user?.id;

            
            if (!fullName || !email) {
                return res.status(400).json({ message: 'Заполните обязательные поля!' });
            }

           
            const currentStudent = await prisma.student.findUnique({ where: { id } });
            if (!currentStudent) {
                return res.status(404).json({ error: 'Студент не найден!' });
            }

            
            if (currentStudent.email !== email) {
                const emailUsedByStudent = await prisma.student.findUnique({ where: { email } });
                const emailUsedByTeacher = await prisma.teacher.findUnique({ where: { email } });

                if (emailUsedByStudent || emailUsedByTeacher) {
                    return res.status(400).json({ message: 'Этот email уже занят другим пользователем!' });
                }
            }

            
            const updateData = { fullName, email };
            if (pinCode) {
                updateData.pinCode = await bcrypt.hash(pinCode, 10);
            }

            
            await prisma.student.update({
                where: { id },
                data: updateData
            });

            return res.status(200).json({ message: 'Профиль студента успешно обновлен!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при обновлении данных студента!' });
        }
    }


    async updateTeacherProfile(req, res, next) {
        try {
            const { fullName, email, password } = req.body; // Обратите внимание: у преподов поле называется passwordHash в схеме
            const id = req.user?.id;

            
            if (!fullName || !email) {
                return res.status(400).json({ message: 'Заполните обязательные поля!' });
            }

            
            const currentTeacher = await prisma.teacher.findUnique({ where: { id } });
            if (!currentTeacher) {
                return res.status(404).json({ error: 'Преподаватель не найден!' });
            }

            
            if (currentTeacher.email !== email) {
                const emailUsedByStudent = await prisma.student.findUnique({ where: { email } });
                const emailUsedByTeacher = await prisma.teacher.findUnique({ where: { email } });

                if (emailUsedByStudent || emailUsedByTeacher) {
                    return res.status(400).json({ message: 'Этот email уже занят другим пользователем!' });
                }
            }

            
            const updateData = { fullName, email };
            if (password) {
                updateData.passwordHash = await bcrypt.hash(password, 10);
            }

            
            await prisma.teacher.update({
                where: { id },
                data: updateData
            });

            return res.status(200).json({ message: 'Профиль преподавателя успешно обновлен!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка сервера при обновлении данных преподавателя!' });
        }
    }
}

module.exports = new UserController();
