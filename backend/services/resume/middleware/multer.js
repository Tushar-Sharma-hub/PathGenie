import fs from "fs"
import multer from "multer"
const uploadPath = "../uploads"

if(!fs.existsSync(uploadPath)){
fs.mkdirSync(uploadPath)
}

//Store the details of pdf destination and filename.
const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
      cb(null , uploadPath)
    },
    filename:(req,file,cb)=>{
        cb(null , file.originalname)
    }
})

//Checks for pdf only file.
const fileFilter = (req,file,cb)=>{
    if(file.mimetype === "application/pdf"){
        cb(null , true)
    }else{
        cb(new Error("Only PDF files are allowed") , false)
    }
}

//Upload the pdf(Checks storage fo destination and filename,fileFilter for pdf only files and Limits for 20mb max pdf size file,)
export const upload = multer({
    storage,
    fileFilter,
    limits:{
        fileSize: 20 *1024 * 1024  //20 mb
    }
})
