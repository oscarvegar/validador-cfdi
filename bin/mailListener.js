var MailListener = require("mail-listener2");
var fs =  require('fs.extra');
var fse =  require('fs-extra');
var nodemailer = require('nodemailer');
var low = require('lowdb')
var db = low('db.json')
var mailcfg = require("../config/mail-cfg");
var transporter = nodemailer.createTransport(mailcfg.transporterConfig);
mailcfg.mailConfig.attachmentOptions =  { directory: "../logic/attachments/" };
var mailListener = new MailListener(mailcfg.mailConfig);
var Q = require('q');
var pdfText = require('pdf-text')
/*DISTANCIA ENTRE STRINGS*/
var Levenshtein = require('levenshtein');
/*VALIDAR LICENCIA*/
var license = require("../config/license");
/** LIBRERIAS PARA PARSEAR LOS XML **/
var parseString = require('xml2js').parseString;
/**LIBRERIAS ENCRIPTAR DESENCRIPTAR**/
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';

var _RUTA_ATTACHMENTS = "../logic/attachments/";
var _RUTA_NUEVOS = "../logic/new/";
var _RUTA_PDF = "../logic/pdf/"


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
  var faltaParejita = [];
  var XMLdocuments = [];
  var PDFdocuments = [];
  for(var i in mail.attachments){
    if(mail.attachments[i].fileName.toLowerCase().search(/.xml/)>-1){
      XMLdocuments.push(mail.attachments[i].fileName);
    }
    if(mail.attachments[i].fileName.toLowerCase().search(/.pdf/)>-1){
      PDFdocuments.push(mail.attachments[i].fileName);
    }
  }
  if(XMLdocuments.length==0 || PDFdocuments.length==0 || XMLdocuments.length!=PDFdocuments.length){
    sendMailException(mail);
    return;
  }
  var xmlPromises=[];
  for(var i in XMLdocuments){
    var XMLFilename = _RUTA_ATTACHMENTS+XMLdocuments[i];
    var contentsXML = fs.readFileSync(XMLFilename).toString();
    xmlPromises.push(parseXMLFile(contentsXML))
  }
  Q.all(xmlPromises).allSettled(xmlPromises).then(function(parsedXMLS){
    console.info("TERMINA DE LEER XML'S")
    var promises = [];
    for(var i in PDFdocuments){
      promises.push(getPDFText(_RUTA_ATTACHMENTS+PDFdocuments[i]))
    }
    Q.all(promises).allSettled(promises).then(function(PDFContents){
      console.info("TERMINA DE LEER PDF'S")
      var moves = [];
      for(var i=0;i<parsedXMLS.length;i++){
        var haceMatch = false;
        var parsedXML = parsedXMLS[i].value;
        var rfcReceptor = parsedXML['cfdi:Comprobante']['cfdi:Receptor'][0]['$']["rfc"];
        if(!validarLicencia(rfcReceptor,XMLdocuments[i])){
          faltaParejita.push(XMLdocuments[i]);
          //parsedXMLS.splice(i,1);
          continue;
        }

        var UUIDXML = parsedXML['cfdi:Comprobante']['cfdi:Complemento'][0]['tfd:TimbreFiscalDigital'][0]['$']['UUID'];
        UUIDXML = UUIDXML.toUpperCase();
        //console.log("UUIDXML >>> ",UUIDXML)
        for(var j in PDFContents){
          if(PDFContents[j]==null || PDFdocuments[j] == null)continue;
          var PDFContent = PDFContents[j].value;
          if(searchUUIDinPDF(UUIDXML,PDFContent)){
            haceMatch = true;
            console.info("XML",XMLdocuments[i],"HACE MATCH CON PDF",PDFdocuments[j])
            moves.push(moveSync(_RUTA_ATTACHMENTS+XMLdocuments[i],_RUTA_NUEVOS+UUIDXML+".xml"))
            moves.push(moveSync(_RUTA_ATTACHMENTS+PDFdocuments[j], _RUTA_PDF+UUIDXML+".pdf"))
            PDFdocuments[j] = null;
            db('email').push({id:UUIDXML,seqno:seqno})
            break;
          }
        } 
        if(haceMatch==false){
          console.error("NO SE ENCONTRO LA PAREJITA PARA EL ARCHIVO : ",XMLdocuments[i])
          faltaParejita.push(XMLdocuments[i]);
        }
      }
      Q.all(moves).allSettled(moves).then(function(filenames){
        console.info("TERMINA MUEVE ARCHIVOS !")
        for(var i in PDFdocuments){
          if(PDFdocuments[i]!=null){
            console.error("NO SE ENCONTRO LA PAREJITA PARA EL ARCHIVO : ",PDFdocuments[i])
            faltaParejita.push(PDFdocuments[i])
          }
        }
        if(faltaParejita.length>0){
          sendMailNoMatch(mail,faltaParejita);
          for(var i in faltaParejita){
            console.info("ELIMINANDO ARCHIVO : ",faltaParejita[i]) 
            fs.unlink(_RUTA_ATTACHMENTS+faltaParejita[i])
          }
          //console.log("faltaParejita.toString()",faltaParejita.toString())
        }
      }).fail(function(err){
        console.error(err)
      })
    }).fail(function(err){
      console.error(err)
    })
  })
});

function searchUUIDinPDF(UUID,pdfChunks){
  if(pdfChunks.join().toUpperCase().indexOf(UUID.toUpperCase())>=0){
    return true;
  }
  return false;
}

function moveSync(origin,destiny){
  var deferred = Q.defer();
  fse.move(origin, destiny, {clobber:true},function(err){
    if(err){
      console.log(err)
      deferred.reject(err)
    }
    else deferred.resolve(destiny)
  })
  return deferred.promise;
}
 
function parseXMLFile(contents){
  var deferred = Q.defer();
  parseString(contents, function (err, parsedXML) {
    if(err){
      console.error(contents)
      deferred.reject(err)
    }
    else deferred.resolve(parsedXML)
  })
  return deferred.promise;
}

function getPDFText(filename){
  var deferred = Q.defer()
  pdfText(filename, function(err, chunks) {
    if(err){
      console.error("ERROR EN ARCHIVO >>>",filename)
      deferred.reject(err)
    }
    else deferred.resolve(chunks);
  })
  return deferred.promise;
};


function sendMailException(mail){
  //console.log("MAIL",mail)
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

function sendMailNoMatch(mail,names){
  //console.log("MAIL",mail)
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
  options.subject = '<FALTA CORRESPONDENCIA XML-PDF>';
  options.html ="No se encotró correspondencia XML/PDF para los siguientes archivos.<BR><BR>";
  for(var i in names){
    options.html+="<BR>"+names[i];
  }
  transporter.sendMail(options, function(error, info){
    if(error){
      sendMailNoMatch(mail,names);
    }else{
      console.log('Message sent: ' + info.response);
    }
  });
}

function validarLicencia(rfcReceptor,filename){
  var com = license.license.rfcs;
  for(var i in com){
    if(new Levenshtein( decrypt(com[i]).toLowerCase(), rfcReceptor.toLowerCase() ) == 0){
      return true;
    }
  }
  for(var i in com){
    var dec = decrypt(com[i]);
    var distance = new Levenshtein(dec.toLowerCase(), rfcReceptor.toLowerCase() );
    if(distance <= 3){
      console.error("X X X X X ERROR RFC SEMEJANTE X X X X X RFC RECIBIDO >>>>> "+rfcReceptor+" | RFC PROBABLE >>>"+dec)
      sendMailSemejante(rfcReceptor,dec,filename);
      return false;
    }
  }
  console.error("X X X X X ERROR DE LICENCIA X X X X X : "+rfcReceptor)
  sendMailInvalidLicense(rfcReceptor,filename);
  return false;
}

function sendMailInvalidLicense(rfcReceptor,filename){
  var options = mailcfg.mailOptions[0].config;
  options.html = "<b>La factura del archivo "+filename+" no es cubierta por la licencia.<BR><BR>RFC receptor:"+rfcReceptor+"</b>";
  options.subject = 'LICENCIA INVALIDA';
  transporter.sendMail(options, function(error, info){
    if(error)sendMailInvalidLicense(rfcReceptor,filename);
    else console.log('Message sent: ' + info.response);
  });
}

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function sendMailSemejante(rfc,rfcsem,filename){
  var options;
  for(var i in mailcfg.mailOptions){
    if(mailcfg.mailOptions[i].rfc == rfc){
      options = mailcfg.mailOptions[i].config;
    }
  }
  if(!options)
    options = mailcfg.mailOptions[0].config;
  options.html = "<b>Se ha recibido una factura con RFC receptor inválido.</b>\
  <br><br>\
  RFC RECIBIDO : <b>"+rfc+"</b>\
  <br>RFC PROBABLE :<b> "+rfcsem+"</b>\
  <br>ARCHIVO :<b> "+filename+"</b>\
  <br><br>\
  Verifique con el proveedor de dicha factura.";
  options.subject = 'Factura Invalida',
  console.info("ENVIANDO CORREO",options.html)
  transporter.sendMail(options, function(error, info){
    if(error){
      console.log(error);
    }else{
      console.log('Message sent: ' + info.response);
    }
  });

}