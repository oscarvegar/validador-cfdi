var soap = require('soap');
var fs =  require('fs.extra');
var fse =  require('fs-extra');
var watch = require('node-watch');
var parseString = require('xml2js').parseString;
var schedule = require('node-schedule');
var moment = require('moment');
var nodemailer = require('nodemailer');
var mailcfg = require("../config/mail-cfg");
var license = require("../config/license");

var rutaError = "../logic/error/";
var rutaNew = "../logic/new/";
var rutaValid = "../logic/valid/";
var rutaPDF = "../logic/pdf/";

var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';

var Levenshtein = require('levenshtein');

var low = require('lowdb')

var emailman = require ('./emailManager');

var transporter = nodemailer.createTransport(mailcfg.transporterConfig);


var url = 'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?singleWsdl';
console.info("***** A LA ESPERA DE NUEVOS DOCUMENTOS *****")
watch(rutaNew, {recursive: false},function(filename) {
	console.log(filename, ' changed.');
	try{
		var contents = fs.readFileSync(filename).toString();
		setTimeout(delay,5000,filename,contents);
	}catch(err){
		console.log("FILE NOT HERE")
		return
	}
});

function delay(filename,contents){
	parseString(contents, function (err, result) {
		if(err){
			console.log("ERROR EN EL PARSEO")
			fs.unlink(filename, console.log())
			return
		}
		if(result['cfdi:Comprobante'] === undefined){
			fs.unlink(filename, console.log())
		}
		else{
			var serie = result['cfdi:Comprobante']['$']['serie'];
			var folio = result['cfdi:Comprobante']['$']['folio'];
			var re = result['cfdi:Comprobante']['cfdi:Emisor'][0]['$']["rfc"];
			var rr = result['cfdi:Comprobante']['cfdi:Receptor'][0]['$']["rfc"];
			var tt = result['cfdi:Comprobante']['$']['total'];
			var uuid = result['cfdi:Comprobante']['cfdi:Complemento'][0]['tfd:TimbreFiscalDigital'][0]['$']['UUID'];
			var expresionImpresa = "?re="+re+"&rr="+rr+"&tt="+tt+"&id="+uuid;
			var rfcReceptor = result['cfdi:Comprobante']['cfdi:Receptor'][0]['$']['rfc'];
			var vendorName = result['cfdi:Comprobante']['cfdi:Emisor'][0]['$']["nombre"];
			var singleFilename = uuid;
			console.log("EXPRESION IMPRESA >>>>> "+expresionImpresa);
			var args = {expresionImpresa: expresionImpresa};
			soap.createClient(url, function(err, client) {
				if(err){
					console.error("ERROR AL CREAR CLIENTE SOAP REINTENTANDO >>>>>",err);
					return delay(filename,contents);

				}
				if(!client)return delay(filename,contents);
				client.Consulta(args, function(err, result) {
					if(!result){
						console.error("ERROR EN RESULT,",filename)
						return delay(filename,contents);;
					}
					console.log("result.ConsultaResult > > > > >",result.ConsultaResult);
					console.log("result.ConsultaResult.CodigoEstatus > > > > >",result.ConsultaResult.CodigoEstatus);
					console.log("result.ConsultaResult.Estado",result.ConsultaResult.Estado);
					var comando = "";
					
					if(result.ConsultaResult.CodigoEstatus.search(/satisfactoriamente/) > -1 && result.ConsultaResult.Estado == 'Vigente'){
						fse.move(filename, filename.replace("new","valid"), {clobber:true},function(err){
						    if(err)console.log(err)
							console.info("SE MOVIO  "+filename+" A LA RUTA DE DOCUMENTOS VALIDOS");      
					  	})
						/* 	SE CREA EL ARCHIVO TXT*/
						result.status = 0;
						if(fs.existsSync(rutaError+singleFilename+".txt")){
							fs.rmrfSync(rutaError+singleFilename+".txt");
						}
						fs.writeFile(rutaValid+uuid+".txt", JSON.stringify(result), function(err){
							if (err) {
								throw err;
							}
							console.log("SE CREO ARCHIVO "+uuid+".txt"+" EN LA CARPETA VALIDOS");
						})
						fse.move(rutaPDF+singleFilename+".pdf", rutaValid+singleFilename+".pdf", {clobber:true},function(err){
						    if(err)console.log(err)
							console.info("SE MOVIO PDF "+filename+" A LA RUTA DE DOCUMENTOS VALIDOS");      
					  	})
						
					}else if(result.ConsultaResult.CodigoEstatus.search(/satisfactoriamente/) > -1){
						var options = mailcfg.mailOptions[0].config;
						for(var i in mailcfg.mailOptions){
							if(mailcfg.mailOptions[i].rfc == rfcReceptor){
								options = JSON.parse(JSON.stringify(mailcfg.mailOptions[i].config));
								options.to = options.to + ","+mailcfg.mailOptions[0].config.to;
								break;
							}
						}
						options.html = "<b>La factura del emisor "+vendorName+" esta en estado "+result.ConsultaResult.Estado+"</b>";
						options.subject = 'Factura Estado '+result.ConsultaResult.Estado,
						transporter.sendMail(options, function(error, info){
							if(error){
								console.log(error);
							}else{
								console.log('Message sent: ' + info.response);
							}
						});
						try{
							fs.unlink(rutaNew+singleFilename+".xml", function(args){
								console.info("SE ELIMINO", singleFilename,".xml")
							})

							fs.unlink(rutaPDF+singleFilename+".pdf", function(args){
								console.info("SE ELIMINO", singleFilename,".pdf")
							})
						}catch(err){
							console.error("ERROR AL BORRAR, ARCHIVO PREVIAMENTE BORRADO")
						}
						//emailman.deleteMail(doc.seqno)


					}else if(result.ConsultaResult.CodigoEstatus.search(/601/) > -1){
						console.log("ERROR 601")
						fse.move(filename, "../logic/error/"+singleFilename+".xml", { clobber: true },function (err) {
							if (err) {
								return console.error(err) 
							}
							console.log("Moved "+filename+" to error");
							//fs.rmrfSync(filename);
						});
						if(!fs.existsSync(rutaError+singleFilename+".txt")){
							result.fechaError = new Date();
							result.status = -1;
							fs.writeFile(rutaError+singleFilename+".txt", JSON.stringify(result), function(err){
								if (err) {
									throw err;
								}
								console.log("Created "+rutaError+singleFilename+".txt"+" TO ERROR");
							})
						}
					}else if(result.ConsultaResult.CodigoEstatus.search(/602/) > -1){
						console.log("ERROR 602")
						fse.move(filename,rutaError+singleFilename+".xml",{clobber:true},function(err){
							if (err) return console.error(err) 
								console.log("MOVED"+filename+" TO "+rutaError)
						})
						if(!fs.existsSync(rutaError+singleFilename+".txt")){
							result.fechaError = new Date();
							result.status = -2;
							fs.writeFile(rutaError+singleFilename+".txt", JSON.stringify(result), function(err){
								if (err) {
									throw err;
								}
								console.log("Created "+rutaError+singleFilename+".txt"+" TO ERROR");
							})
						}
					}
				});
			})
		}
	});

}




/*LOGICA PARA REINTENTAR EL ENVIO DE LOS DE ERROR*/

var rule = new schedule.RecurrenceRule();
schedule.scheduleJob('*/5 * * * *', reintentaEnvio); 
reintentaEnvio();


function reintentaEnvio(){
	var files = fs.readdirSync(rutaError);
	for(var i in files){
		mueveArchivo(files[i])
	}
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function mueveArchivo(elem){
	if(endsWith(elem,".txt")){
		console.log("Muerve archivos")
		var file = elem;
		var fileXML = file.replace(".txt",".xml");
		if(fs.existsSync(rutaError+fileXML)==false){
			fs.unlink(rutaError+file, function(args){})
			return;
		}
		console.log("FILE >>> "+file)
		var contents = fs.readFileSync(rutaError+file,'UTF-8');
		var respuestaSat = JSON.parse(contents);
		var fechaVencimiento = moment(respuestaSat.fechaError).add(3, 'days');
		var diff = moment().diff(fechaVencimiento);
		console.log("DIFF >>>>>>"+diff); 
		if(diff < 0){
			fse.move(rutaError+fileXML,rutaNew+fileXML,{clobber:true},function(err){
				if (err) return console.error(err) 
					console.log("MOVED"+fileXML+" TO "+rutaValid)
			})
		}else{
			fse.move(rutaError+file,rutaValid+file,{clobber:true},function(err){
				if (err) return console.error(err)
					console.log("MOVED"+file+" TO "+rutaValid)
				fse.move(rutaError+fileXML,rutaValid+fileXML,{clobber:true},function(err){
					fs.unlink(file, function(args){})
					if (err) return console.error(err) 
						console.log("MOVED"+fileXML+" TO "+rutaValid)
					var options = mailcfg.mailOptions[0].config;
					options.html = "<b>La factura "+fileXML+" no se pudo validar.</b>"
					options.subject = 'Factura Invalida',
					transporter.sendMail(options, function(error, info){
						if(error){
							console.log(error);
						}else{
							console.log('Message sent: ' + info.response);
						}
					});
				})
			})
		}
	};
}

function walk(currentDirPath, callback) {
    var fs = require('fs'), path = require('path');
    fs.readdirSync(currentDirPath).forEach(function(name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walk(filePath, callback);
        }
    });
}

walk("../logic/new", function(filePath, stat) {
   console.log(filePath, ' init.');
   if(filePath.search(".xml")<0)return;
	try{
		var contents = fs.readFileSync(filePath).toString();
		setTimeout(delay,5000,filePath,contents);
	}catch(err){
		console.log("FILE NOT HERE")
		return
	}
});