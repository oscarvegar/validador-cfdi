var MailListener = require("mail-listener2");
 
 var mailcfg = require("../config/mail-cfg");
 mailcfg.mailConfig.attachmentOptions =  { directory: "../logic/attachments/" };
 console.log(mailcfg.mailConfig)

var mailListener = new MailListener(mailcfg.mailConfig);
 
mailListener.start(); // start listening 
 
// stop listening 
//mailListener.stop(); 
 
mailListener.on("server:connected", function(){
  console.log("imapConnected");
});
 
mailListener.on("server:disconnected", function(){
  console.log("imapDisconnected");
});
 
mailListener.on("error", function(err){
  console.log(err);
});
 
mailListener.on("mail", function(mail, seqno, attributes){
  // do something with mail object including attachments 
  console.log("emailParsed", mail);
  // mail processing code goes here 
});
 
mailListener.on("attachment", function(attachment){
  console.log("ATTACHMENT RECEIVED");
  console.log(attachment);
});
 