module.exports = {
  //publicPath:'./',//根路径
  outputDir:'media-web',//打包的时候生成的一个文件名
  publicPath: process.env.NODE_ENV === 'production'?'./':'/media-web',
  devServer: {
    port: 8888,
    https: true,
    proxy: {
      '/socket.io': {
        target: 'http://192.168.1.105:19000/',//正式服
        changeOrigin: true,
        ws: true
      },
      '/remote-server': {
        target: 'http://localhost:18080/',//本地springboot
        //target: 'https://172.26.180.229/',//测试服springboot
        changeOrigin: true,
      },
    }
  },  
}