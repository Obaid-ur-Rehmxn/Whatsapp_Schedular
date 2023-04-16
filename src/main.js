import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {ref, getDatabase, set, get,onValue} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
const server = require('./url')
const database = require('./database')
const firebaseConfig = database

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

let QR=ref(db, 'QR');
onValue(QR, (snapshot) => {
  let data = snapshot.val();
  if(data.qr==="") {
    document.getElementsByClassName("qrcodediv")[0].style.display="none";
    document.getElementsByClassName("main")[0].style.display="block";
  }
  else {
    document.getElementsByClassName("main")[0].style.display="none";
    document.getElementsByClassName("qrcodediv")[0].style.display="block";
    new QRious({element: document.getElementById("qrcode"),
     value: data.qr,
     size: 400,
     background: "white",
     foreground: "black",
     level: "H",
     padding:null
    });
  }
});

let form = document.getElementById("form");
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  let name = document.getElementById("name").value;
  let time = document.getElementById("time").value;
  let file = document.getElementById("file").files[0];
  let message = document.getElementById("message").value;
  let no = document.getElementById("no").files[0];
  let datetime = document.getElementById("datetime").value;
  let data1 = await loadFile(no);
  let filename = "";
  let number =data1.slice(0,-1);
  for(let i in number) {
    number[i]+="@c.us";
  }
  if (message == "" && typeof file === "undefined") {
    alert("Please enter a message or upload a file");
  } else {
    if(datetime !== "" && time!=="") {
        alert("You can enter only one kind of schedule")
    }
    else if(time==="" && datetime==="") {
        alert("Please enter atleast one kind of schedule")
    }
    else{
    let formdata=new FormData();
    formdata.append("name",name);
    if(typeof file!=="undefined") {
        filename=name+"."+file.name.split(".")[file.name.split(".").length-1];
        formdata.append("file",file,filename);
    }
    if(datetime!=="") {
        set(ref(db, 'Schedule/'+name),{
            "name":name,
            "number":number,
            "message":message,
            "datetime":datetime,
            "filename":filename
        })
        .then(()=>{
          formdata.append("datetime",datetime)
          formdata.append("status","uploaded")
        fetch(server+"/api/datetime",{
            method:"POST",
            body:formdata
        })
        .then(res=>res.json())
        .then(data=>{
            alert(data.message);
            document.getElementById("form").reset();
        })
    })
    }
    else {
      let hours = time.split(":")[0];
      let minutes = time.split(":")[1];
        set(ref(db, 'Schedule/'+name),{
            "name":name,
            "number":number,
            "message":message,
            "hours":hours,
            "minutes":minutes,
            "filename":filename
        })
        .then(()=> {
          formdata.append("hours",hours)
          formdata.append("minutes",minutes)
          formdata.append("status","uploaded")
        fetch(server+"/api/time",{
            method:"POST",
            body:formdata
        })
        .then(res=>res.json())
        .then(data=>{
            alert(data.message);
            document.getElementById("form").reset();
        })
    })
}
    }
  }
});

async function loadFile(file) {
  let text = await file.text();
  return text.split("\r\n");
}

async function getSchedule() {
  let data = await get(ref(db, 'Schedule'));
  let schedule = data.val();
  if (schedule!==null) {
  let keys = Object.keys(schedule);
  let table = document.getElementsByTagName("tbody")[0];
  table.innerHTML="";
  for (let i in keys) {
    let key = keys[i];
    let name1 = schedule[key].name;
    let row=table.insertRow();
    row.setAttribute("id",name1);
    let td1=row.insertCell();
    let td2=row.insertCell();
    td1.innerHTML=name1;
    let button=document.createElement("button");
    button.innerHTML="Delete";
    button.setAttribute("class","delete");
    button.setAttribute("id","delete");
    button.addEventListener("click",async function() {
      let obj={
        "name":name1
      }
      fetch(server+"/api/delete",{
        method:"POST",
        headers:{"Content-Type": "application/json"},
        body:JSON.stringify(obj)
    })
    .then(res=>res.json())
    .then(data=>{
        alert(data.message);
    })
    });
    td2.appendChild(button);
  }
}
}

getSchedule();

let change=ref(db, 'Schedule');
onValue(change, (snapshot) => {
  getSchedule();
});
