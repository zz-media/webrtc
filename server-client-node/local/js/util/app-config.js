//F:\workspace\moc30-2\RG-SCP-IIB_3.00.1\rg-scp-lib-remote-desktop\remote-desktop-client\local\js\util
//F:\workspace\moc30-2\RG-SCP-IIB_3.00.1\rg-scp-lib-remote-desktop\remote-desktop-client\dist\scpRemoteApp-win32-x64\resources\app.asar\local\js\util
function getConfigFilePath(){
    var path = null;
    if(__dirname.indexOf("app.asar")>-1){
        path = __dirname.replace("\\\app.asar\\local\\js\\util","\\config\\config.json");
    }else{
        path = __dirname.replace("\\local\\js\\util","\\config\\config.json");
    }
    
    return path;
}

function getConfigJson(){
    var config = require(getConfigFilePath());
    return config;
}

module.exports = {getConfigFilePath,getConfigJson}
