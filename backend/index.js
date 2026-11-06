const express=  require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer =require('multer');
const path = require('path');
const routerAuth = require('./routes/auth.routes');
const routerUpdate = require('./routes/update.routes');
const routerAdmin = require('./routes/admin.routes');
const routerStudent = require('./routes/student.routes');
const routerPrepod = require('./routes/teacher.routes')
dotenv.config();
const PORT = process.env.PORT;

const ORIGIN = process.env.ORIGIN;
const app = express();
app.use(express.json());
app.use(cors({
    origin:'http://localhost:5173',
    methods: ['GET','POST','PUT','DELETE'],
    exposedHeaders: ['Content-Disposition']

}))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.use('/api', routerAuth);
app.use('/api', routerUpdate);
app.use('/api',routerAdmin);
app.use('/api', routerStudent);
app.use('/api', routerPrepod)


app.listen(PORT,()=>{
    console.log('Сервер запущен: http://localhost:5000')
})