﻿var soap = require('soap');
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

var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';

var Levenshtein = require('levenshtein');

var transporter = nodemailer.createTransport(mailcfg.transporterConfig);


var url = 'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?singleWsdl';
console.info("***** A LA ESPERA DE NUEVOS DOCUMENTOS *****")
watch(rutaNew, {recursive: false},function(filename) {
	console.log(filename, ' changed.');
	try{
		var contents = fs.readFileSync(filename).toString();
	}catch(err){
		console.log("FILE NOT HERE")
		return
	}
	parseString(contents, function (err, result) {
		if(err)return console.log("ERROR EN EL PARSEO")
		if(result['cfdi:Comprobante'] === undefined){
			fs.copy(filename, filename.replace(/\/new\//g, "error"), { replace: true },function (err) {
				if (err) {
					throw err;
				}
				console.log("Moved "+filename+" to error");
				fs.rmrfSync(filename);
				return
			});
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
			var defaultName="";
			if(!folio)
				var defaultName = result['cfdi:Comprobante']['cfdi:Complemento'][0]['registrofiscal:CFDIRegistroFiscal'][0]['$']["Folio"];
			var licencia = validarLicencia(rfcReceptor);
			if(licencia.code===-1){
				console.error("X X X X X ERROR RFC SEMEJANTE X X X X X RFC RECIBIDO>>> "+rfcReceptor+" | RFC PROBABLE >>>"+licencia.rfcLic)
				sendMailSemejante(rfcReceptor,licencia.rfcLic,re,vendorName,folio);
				return;
			}else if(licencia.code===-2){
				console.error("X X X X X ERROR DE LICENCIA X X X X X : "+rfcReceptor)
				return;
			}
			console.log("EXPRESION IMPRESA >>>>> "+expresionImpresa);
			var args = {expresionImpresa: expresionImpresa};
			soap.createClient(url, function(err, client) {
				client.Consulta(args, function(err, result) {
					console.log(result.ConsultaResult);
					console.log(result.ConsultaResult.CodigoEstatus);
					console.log(result.ConsultaResult.Estado);
					var comando = "";
					console.log("serie",serie)
					console.log("folio",folio)
					if(!serie)serie="";
					if(!folio)folio=defaultName;
					var nuevoNombre = re+"-"+serie+folio;
					console.log("NUEVO NOMBRE",nuevoNombre);
					if(result.ConsultaResult.Estado == 'Vigente'){
						fs.copy(filename, rutaValid+nuevoNombre+".xml", { replace: true },function (err) {
							if (err) {
								throw err;
							}
							console.log("Moved "+filename+" to valid");
							fs.rmrfSync(filename);
						});
						/* SE RENOMBRA EL PDF */
						/* 	SE CREA EL ARCHIVO TXT*/
						result.status = 0;
						if(fs.existsSync(rutaError+nuevoNombre+".txt")){
							fs.rmrfSync(rutaError+nuevoNombre+".txt");
						}
						fs.writeFile("../logic/valid/"+nuevoNombre+".txt", JSON.stringify(result), function(err){
							if (err) {
								throw err;
							}
							console.log("Created "+rutaValid+re+"-"+serie+folio+".txt"+" to valid");
						})
						
						if(fs.existsSync(filename.replace('new','pdf').replace(".xml",".pdf"))){
							console.info("***** RENOMBRANDO PDF *****")
							fs.renameSync(filename.replace('new','pdf').replace(".xml",".pdf"), "../logic/pdf/"+nuevoNombre+".pdf")
						}
					}else if(result.ConsultaResult.CodigoEstatus.search(/601/) > -1){
						console.log("ERROR 601")
						fs.copy(filename, "../logic/error/"+nuevoNombre+".xml", { replace: true },function (err) {
							if (err) {
								throw err;
							}
							console.log("Moved "+filename+" to error");
							fs.rmrfSync(filename);
						});
						if(!fs.existsSync(rutaError+nuevoNombre+".txt")){
							result.fechaError = new Date();
							result.status = -1;
							fs.writeFile(rutaError+nuevoNombre+".txt", JSON.stringify(result), function(err){
								if (err) {
									throw err;
								}
								console.log("Created "+rutaError+nuevoNombre+".txt"+" to valid");
							})
						}
					}else if(result.ConsultaResult.CodigoEstatus.search(/602/) > -1){
						console.log("ERROR 601")
						fse.move(filename,rutaError+nuevoNombre+".xml",{clobber:true},function(err){
							if (err) return console.error(err) 
								console.log("MOVED"+fileXML+" TO "+rutaValid)
						})
						if(!fs.existsSync(rutaError+nuevoNombre+".txt")){
							result.fechaError = new Date();
							result.status = -2;
							fs.writeFile(rutaError+nuevoNombre+".txt", JSON.stringify(result), function(err){
								if (err) {
									throw err;
								}
								console.log("Created "+rutaError+nuevoNombre+".txt"+" to valid");
							})
						}
					}
				});
			})
		}
	});
});

function validarLicencia(rfc){
	var com = license.license.rfcs;
	for(var i in com){
		if(new Levenshtein( decrypt(com[i]).toLowerCase(), rfc.toLowerCase() ) == 0){
			return {code:1};
		}
	}
	for(var i in com){
		var dec = decrypt(com[i]);
		var distance = new Levenshtein(dec.toLowerCase(), rfc.toLowerCase() );
		if(distance <= 3){
			return {code:-1,rfcFac:rfc,rfcLic:dec};
		}
	}
	return {code:-2};
	
}

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

/*LOGICA PARA REINTENTAR EL ENVIO DE LOS DE ERROR*/

var rule = new schedule.RecurrenceRule();
rule.minute = 42;
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
		var file = elem;
		var fileXML = file.replace(".txt",".xml");
		console.log("FILE >>> "+file)
		var contents = fs.readFileSync(rutaError+file,'UTF-8');
		var respuestaSat = JSON.parse(contents);
		var fechaVencimiento = moment(respuestaSat.fechaError).add(3, 'days');
		var diff = moment().diff(fechaVencimiento);
		console.log("DIFF >>>>>>"+diff); 
		if(diff > 0){
			fse.move(rutaError+fileXML,rutaNew+fileXML,{clobber:true},function(err){
				if (err) return console.error(err) 
					console.log("MOVED"+fileXML+" TO "+rutaValid)
			})
		}else{
			fse.move(rutaError+file,rutaValid+file,{clobber:true},function(err){
				if (err) return console.error(err)
					console.log("MOVED"+file+" TO "+rutaValid)
				fse.move(rutaError+fileXML,rutaValid+fileXML,{clobber:true},function(err){
					if (err) return console.error(err) 
						console.log("MOVED"+fileXML+" TO "+rutaValid)
					var options = mailcfg.mailOptions;
					options.html = "<b>La factura "+fileXML+" no se pudo validar.</b>"
					transporter.sendMail(mailcfg.mailOptions, function(error, info){
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

function sendMailSemejante(rfc,rfcsem,rfcEmisor,vedorName,folio){
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
	<br>RFC EMISOR :<b> "+rfcEmisor+"</b>\
	<br>NOMBRE EMISOR :<b> "+vedorName+"</b>\
	<br>FOLIO DE FACTURA :<b> "+folio+"</b>\
	<br><br>\
	Verifique con el proveedor de dicha factura.";
	console.info("ENVIANDO CORREO",options.html)
	transporter.sendMail(options, function(error, info){
		if(error){
			console.log(error);
		}else{
			console.log('Message sent: ' + info.response);
		}
	});

}