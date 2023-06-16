var crypto = require('crypto');

var name = "user1";
var secret = "123456";
//var unixTimeStamp = parseInt(Date.now()/1000) + 24*3600;  // this credential would be valid for the next 24 hours
var unixTimeStamp = parseInt(Date.now()/1000) + 24*3600*1000;
//var unixTimeStamp = 1670565187;
var username = [unixTimeStamp, name].join(':');

hmac = crypto.createHmac('sha1', secret);
hmac.setEncoding('base64');
hmac.write(username);
hmac.end();
var password = hmac.read();

console.log('name',name);
console.log('username',username);
console.log('password',password);

//http://www.wetools.com/sha/
hash = crypto.createHmac('sha1', secret).update(username).digest('hex')
console.log('hash',hash);