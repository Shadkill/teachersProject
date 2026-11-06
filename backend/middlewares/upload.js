const multer = require('multer');
const path = require('path');
const fs = require('fs')


const dangerousExtensions = [
    '.exe', '.msi', '.bat', '.cmd', '.sh', '.vbs', '.vbe', 
    '.js', '.jse', '.wsf', '.wsh', '.ps1', '.scr', '.dll', 
    '.com', '.jar', '.app', '.dmg', '.iso',
    
    '.docm', '.xlsm', '.pptm' 
];
const allowedExtensions = [
    
    '.zip', '.rar', '.7z', '.tar', '.gz',
    
    
    '.doc', '.docx', '.rtf',                   
    '.xls', '.xlsx', '.csv',                   
    '.ppt', '.pptx',                           
    '.accdb', '.mdb',                          
    '.pub', '.vsd', '.vsdx', '.one',           
    '.odt', '.ods', '.odp', '.pdf',            

    
    '.txt', '.md', '.json', '.xml', '.yaml', '.yml', '.ini', '.log', '.sql',

    
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'
];

const fileFilter = (req,file,cb)=>{

    const ext = path.extname(file.originalname).toLowerCase();
    if(dangerousExtensions.includes(ext)){
        return cb(new Error(`Файлы формата ${ext} строго запрещены!`))
    }
    if(allowedExtensions.includes(ext)||file.mimetype.startsWith('text/')){
        return cb(null,true);
    }
    cb(new Error(`Файл формата ${ext} строго запрещён!`))

    
}

const createUploader = (subFolder)=>{
    const uploadDir = path.join('uploads',subFolder);
    if(!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir,{recursive:true})
    }
    const storage = multer.diskStorage({
        destination:(req,file,cb)=>{
            cb(null, uploadDir);
        },
        filename: (req,file,cb)=>{
            const uniqueSuffix = Date.now()+'-'+ Math.round(Math.random()*1E9);
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null,uniqueSuffix+ext)
        }
    })
    return multer({
        storage:storage,
        fileFilter: fileFilter,
        limits:{
            fileSize:50*1024*1024
        }
    })
};

module.exports ={
    uploadMaterial:createUploader('materials'),
    uploadSubmission:createUploader('submissions')
}