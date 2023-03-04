const express=require('express');
const app=express();
const cors=require('cors');
const fs=require('fs');
const multer=require('multer');
const schedule=require('node-schedule');
app.use(cors());
app.use(express.json());
const bodyParser=require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
const admin = require("firebase-admin");
const { MessageMedia } = require('whatsapp-web.js');

const serviceAccount = require("./whatsapp-schedule-firebase-adminsdk-b3p3o-1dd2eaee4b.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://whatsapp-schedule-default-rtdb.firebaseio.com"
  });
const db=admin.database();


const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./uploads');
        },
    filename:function(req,file,cb){
        cb(null,file.originalname);
    }
});

const uploads=multer({storage:storage});
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth()
});

client.initialize();
    client.on('qr', (qr) => {
        db.ref("QR").set({qr:qr});
    })
    client.on('ready', () => {
        db.ref("QR").set({qr:""});
    });

    client.on('disconnected', () => {
        client.destroy();
        client.initialize();
    });
const port=process.env.PORT || 5000;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});

app.post('/api/datetime',uploads.single('file'),async(req,res)=>{
    let name=req.body.name;
    let datetime=req.body.datetime;
    let filename="";
    schedule.scheduleJob(name,datetime,async()=>{
        let ref=db.ref("Schedule/"+name);
        let snapshot=await ref.get();
        if(snapshot.exists()){
            let data=snapshot.val();
            filename=data.filename;
            if(data.filename==""){
                data.number.forEach(async(number)=>{
                    let message=await client.sendMessage(number,data.message);
                })
            }
            else{
                data.number.forEach(async(number)=>{
                    await client.sendMessage(number,data.message);
                    const media=MessageMedia.fromFilePath('./uploads/'+data.filename);
                    let message=await client.sendMessage(number,media);
                })
            }
            if(filename!=""){
                setTimeout(function(){
                    fs.unlinkSync('uploads/'+filename);
                },100000)
            }
            await ref.remove();
            schedule.cancelJob(name);
        }
    });
    res.set("Access-Control-Allow-Origin", "*")
    res.send({message:"Message scheduled"})
})

app.post('/api/time',uploads.single('file'),async(req,res)=>{
    let name=req.body.name
    let hours=req.body.hours
    let minutes=req.body.minutes
    let time='0 '+minutes+' '+hours+' * * *';
    schedule.scheduleJob(name,time,async()=>{
        let ref=db.ref("Schedule/"+name)
        let snapshot=await ref.get();
        if(snapshot.exists()) {
            let data=snapshot.val();
            if(data.filename==""){
                data.number.forEach(async(number)=>{
                    let message=await client.sendMessage(number,data.message);
                })
            }
            else{
                data.number.forEach(async(number)=>{
                    await client.sendMessage(number,data.message);
                    const media=MessageMedia.fromFilePath('./uploads/'+data.filename);
                    let message=await client.sendMessage(number,media);
                })
            }
        }
    })
    res.set("Access-Control-Allow-Origin", "*")
    res.send({message:"Message scheduled"})
})

app.post('/api/delete', async(req,res)=>{
    let name=req.body.name;
    let ref=db.ref("Schedule/"+name);
    let snapshot=await ref.get();
    if(snapshot.exists()){
        if(snapshot.val().filename!=""){
        fs.unlinkSync('uploads/'+snapshot.val().filename);
        schedule.cancelJob(name);
        await ref.remove();
        res.set("Access-Control-Allow-Origin", "*")
        res.send({message:"Schedule deleted"})
        }
        else{
            schedule.cancelJob(name);
            await ref.remove();
            res.set("Access-Control-Allow-Origin", "*")
            res.send({message:"Schedule deleted"})
        }
    }
})

