var MailListener = require("mail-listener2");
var fs =  require('fs.extra');
 
 var mailcfg = require("../config/mail-cfg");
 mailcfg.mailConfig.attachmentOptions =  { directory: "../logic/attachments/" };

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
  //console.log("emailParsed", mail);
  // mail processing code goes here 
});
 
mailListener.on("attachment", function(attachment,mail){
  console.log("> > > > > ATTACHMENT RECEIVED < < < < <");
  console.log(attachment);
  if(attachment.contentType.search(/\/xml/)>-1){
  	console.log(">>> ES XML. Moviendo archivo a carpeta NEW");
  	fs.move('../logic/attachments/'+attachment.generatedFileName, '../logic/new/'+attachment.generatedFileName, function (err) {
	  if (err) {
	    console.log("XXXXX OCURRIO UN ERROR INESPERADO AL MOVER EL ARCHIVO XXXXX");
	    console.log(err);
	    return;
	  }
	  console.log("Moved "+attachment.fileName+" to logic/new/");
	});
  }else{
  	console.log("NO ES XML. Eliminando archivo "+attachment.generatedFileName)
  	fs.unlink('../logic/attachments/'+attachment.generatedFileName, function (err) {
	  if (err) {
	    console.log("XXXXX OCURRIO UN ERROR INESPERADO AL ELIMINAR EL ARCHIVO XXXXX");
	    console.log(err);
	    return;
	  }
	});
  }
});
 