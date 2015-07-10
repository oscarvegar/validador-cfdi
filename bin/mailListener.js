var MailListener = require("mail-listener2");
var fs =  require('fs.extra');
var fse =  require('fs-extra');
var nodemailer = require('nodemailer');
 
 var mailcfg = require("../config/mail-cfg");
var transporter = nodemailer.createTransport(mailcfg.transporterConfig);

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
  var hasXML = false;
  //console.log("ATTACHT",mail.attachments)
  for(var i in mail.attachments){
    if(mail.attachments[i].fileName.toLowerCase().search(/.xml/)>-1)
      hasXML = true;
  }
  if(!hasXML)
    sendMailException(mail);
});
 
mailListener.on("attachment", function(attachment,mail){
  console.log("> > > > > ATTACHMENT RECEIVED < < < < <",attachment.contentType);
  console.log("> > > > > ATTACHMENT NAME < < < < <",attachment.fileName);

  var xmlqty = 0;
  var pdfqty = 0;

  for(var i in mail.attachments){
    var att = mail.attachments[i];
    if(att.generatedFileName.toLowerCase().search(/.xml/)>-1)xmlqty++;
    if(att.generatedFileName.toLowerCase().search(/.pdf/)>-1)pdfqty++;
  }

  if(attachment.fileName.toLowerCase().search(/.xml/)>-1){
	 console.log(">>> ES XML. Moviendo archivo a carpeta NEW");
   var xmltemp = attachment.fileName.toUpperCase().replace(".XML",".xml");
	 fse.move('../logic/attachments/'+attachment.generatedFileName, '../logic/new/'+xmltemp, {clobber:true},function (err) {
	  if (err) {
	    console.error("XXXXX OCURRIO UN ERROR INESPERADO AL MOVER EL ARCHIVO XML XXXXX");
	    console.error(err);
	    return;
	  }
	  console.log("Moved "+attachment.fileName+" to logic/new/");
   });
  }else if(attachment.generatedFileName.toLowerCase().search(/.pdf/)>-1){
    var xmlname = null;
    if(xmlqty==1){
      for(var i in mail.attachments){
        var att = mail.attachments[i];
        if(att.fileName.toLowerCase().search(/.xml/)>-1){
          xmlname = att.fileName;
        }
      }
    }else{
      xmlname = attachment.fileName;
    }
    console.log("XML NAME ::::: ",xmlname)
    if(xmlname == null)return;
    console.log(">>> ES PDF. Moviendo archivo a carpeta PFD");
    var pdfname = '../logic/pdf/'+xmlname.toUpperCase().replace(".XML",".pdf").replace(".PDF",".pdf");
    fse.move('../logic/attachments/'+attachment.generatedFileName, pdfname, {clobber:true},function (err) {
    if (err) {
      console.log("XXXXX OCURRIO UN ERROR INESPERADO AL MOVER EL ARCHIVO PDF XXXXX");
      console.log(err);
      return;
    }
    console.log("Moved "+pdfname+" to logic/pdf/");
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
 
function sendMailException(mail){
  console.log("MAIL",mail)
   var  options = mailcfg.mailOptions[0].config;
  options.html = mail.html;
  if(mail.attachments){
    options.attachments = [];
    for(var i in mail.attachments){
      options.attachments.push(
        {
          filename:mail.attachments[i].fileName,
          content:mail.attachments[i].content
        }
      )
    }
  }
  options.subject = 'FACTURA NO ES XML: '+mail.subject;
  transporter.sendMail(options, function(error, info){
    if(error){
      console.log(error);
    }else{
      console.log('Message sent: ' + info.response);
    }
  });
}
 