const jwt = require('jsonwebtoken');

class Middlewares {
    checkToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: 'Нет доступа (отсутствует токен)' });
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'Неверный формат токена' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Токен недействителен или просрочен' });
        }
    }

    checkStudent(req, res, next) {
        if (req.user.role && req.user.role !== 'STUDENT') {
            return res.status(403).json({ message: 'Доступ разрешен только студентам!' });
        }
        next();
    }

    checkTeacher(req, res, next) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Доступ запрещён, недостаточно прав!' });
        }
        next();
    }

    checkAdmin(req, res, next) {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Доступ разрешён только администраторам!' });
        }
        next();
    }
}

module.exports = new Middlewares();