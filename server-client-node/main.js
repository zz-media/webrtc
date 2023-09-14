'use strict'
var logger = require("./local/js/util/logjs").logger;
logger.info("start remote src app");
var appConfig = require("./local/js/util/app-config");
logger.info("app config path is:"+appConfig.getConfigFilePath());
logger.info("app config startLocalWebServer is:"+appConfig.getConfigJson().startLocalWebServer);
if(appConfig.getConfigJson().startLocalWebServer){
	var localWebServer = require('./local-web-server.js');
	localWebServer.initServer();

  var localWebServerHttp = require('./local-web-server-http.js');
  localWebServerHttp.initServer();
}else{
	logger.info("local web server no start,if you want it work,config startLocalWebServer true");
}

const electron = require('electron')
const electronApp = electron.app
const BrowserWindow = electron.BrowserWindow
electronApp.commandLine.appendSwitch('ignore-certificate-errors');//https://blog.csdn.net/chengzhf/article/details/106873649 Electron中使用socket.io
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800, 
    height: 600,
    title: "远程桌面demo",
	webPreferences:{
		nodeIntegration:true,  
		contextIsolation:false    
	}	
  });
  mainWindow.setWin

  mainWindow.webContents.openDevTools();
  //mainWindow.webContents.openDevTools({mode: 'bottom'});  

  mainWindow.loadFile('local/remote-src.html');//remote-src.html
  //mainWindow.loadURL('https://127.0.0.1/peer/src.html');

//   let view=new BrowserView();
//   view.setBounds({x:10,y:220,width:800,height:300});
//   view.webContents.loadURL('http://127.0.0.1/peer/src.html');
//   mainWindow.setBrowserView(view);

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

electronApp.on('ready', createWindow)

electronApp.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    electronApp.quit()
  }
})

electronApp.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})