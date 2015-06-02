var MailListener = require("mail-listener2");
var fs =  require('fs.extra');
var fse =  require('fs-extra');
 
 var mailcfg = require("../config/mail-cfg");
 mailcfg.mailConfig.attachmentOptions =  { directory: "../logic/attachments/" };

var mailListener = new MailListener(mailcfg.mailConfig);
 
mailListener.start(); 
 
mailListener.on("server:connected", function(){
  console.info("***** ESCUCHANDO CORREOS *****");
});
 
mailListener.on("server:disconnected", function(){
  console.log("imapDisconnected");
});
 
mailListener.on("error", function(err){
  console.log(err);
});
 
mailListener.on("mail", function(mail, seqno, attributes){
  //console.log("> > > > > MAIL RECEIVED < < < < <",mail.text);
  // do something with mail object including attachments 
  //console.log("emailParsed", mail);
  // mail processing code goes here 
});
 
mailListener.on("attachment", function(attachment,mail){
  console.log("> > > > > ATTACHMENT RECEIVED < < < < <",attachment.contentType);
  if(attachment.contentType.search(/\/xml/)>-1){
	 console.log(">>> ES XML. Moviendo archivo a carpeta NEW");
	 fse.move('../logic/attachments/'+attachment.generatedFileName, '../logic/new/'+attachment.generatedFileName, {clobber:true},function (err) {
	  if (err) {
	    console.error("XXXXX OCURRIO UN ERROR INESPERADO AL MOVER EL ARCHIVO XML XXXXX");
	    console.error(err);
	    return;
	  }
	  console.log("Moved "+attachment.fileName+" to logic/new/");
   });
  }else if(attachment.contentType.search(/\/pdf/)>-1){
    var xmlname = null;
    for(var i in mail.attachments){
      var att = mail.attachments[i];
      if(att.contentType.search(/\/xml/)>-1){
        xmlname = attachment.generatedFileName;
      }
    }
    if(xmlname == null)return;
   console.log(">>> ES PDF. Moviendo archivo a carpeta PFD");
   fse.move('../logic/attachments/'+attachment.generatedFileName, '../logic/pdf/'+xmlname.replace(".xml",".pdf"), {clobber:true},function (err) {
    if (err) {
      console.log("XXXXX OCURRIO UN ERROR INESPERADO AL MOVER EL ARCHIVO PDF XXXXX");
      console.log(err);
      return;
    }
    console.log("Moved "+attachment.fileName+" to logic/pdf/");
   });
  }else{
    console.info("NO ES XML ni PDF. Eliminando archivo "+attachment.generatedFileName)
  	fs.unlink('../logic/attachments/'+attachment.generatedFileName, function (err) {
	  if (err) {
	    console.log("XXXXX OCURRIO UN ERROR INESPERADO AL ELIMINAR EL ARCHIVO XXXXX");
	    console.log(err);
	    return;
	  }
	});
  }
});


 