const log4js = require('log4js')
log4js.configure({
    appenders: {
        logFile: {
            type: "dateFile",
            filename: './logs/log',//您要写入日志文件的路径及文件名前缀
            pattern: "yyyy-MM-dd-hh.log",//（可选，默认为.yyyy-MM-dd） - 文件名后缀。格式:.yyyy-MM-dd-hh:mm:ss.log
            alwaysIncludePattern: true,//（默认为false） - 将模式包含在当前日志文件的名称以及备份中
            compress: true,//（默认为false） - 在滚动期间压缩备份文件（备份文件将具有.gz扩展名）
            encoding: 'utf-8',//default "utf-8"，文件的编码
            maxLogSize: 1024 * 1024 // 1M 文件最大存储空间，当文件内容超过文件存储空间会自动生成一个文件xxx.log.1的序列自增长的文件
        },
        logConsole: {
            type: 'console'
        }
    },
    categories: {
        default: {
            appenders: ['logFile', 'logConsole'],
            level: log4js.levels.ALL
        },
        logFile: {
            appenders: ['logFile'],
            level: log4js.levels.ALL
        },
        logConsole: {
            appenders: ['logConsole'],
            level: log4js.levels.ALL
        }
    }
});
let log = log4js.getLogger();
module.exports.logger = log;

