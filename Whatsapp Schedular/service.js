let Service= require('node-windows').Service;
let svc = new Service({
    name:'Whatsapp Schedule',
    description: 'spi whatsapp schedule',
    script: 'C:\\HoperX\\electron-whatsapp\\Whatsapp Schedular\\server.js'
});
svc.on('install',function(){
    svc.start();
}
);
svc.install();