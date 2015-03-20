var soap = require('soap');
var fs =  require('fs.extra');
var watch = require('node-watch');
var parseString = require('xml2js').parseString;

var url = 'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?singleWsdl';

watch('../logic/new/', {recursive: false},function(filename) {
	console.log(filename, ' changed.');
	try{
		var contents = fs.readFileSync(filename).toString();
	}catch(err){
		console.log("FILE NOT HERE")
		return
	}
	parseString(contents, function (err, result) {
		/*console.dir(JSON.stringify(result));*/
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
			console.log("EXPRESION IMPRESA >>>>> "+expresionImpresa);
			/*var re = result['cfdi:Comprobante']['cfdi:Emisor'];*/
			var args = {expresionImpresa: expresionImpresa};
			soap.createClient(url, function(err, client) {
				client.Consulta(args, function(err, result) {
					console.log(result.ConsultaResult);
					console.log(result.ConsultaResult.CodigoEstatus);
					console.log(result.ConsultaResult.Estado);
					var comando = "";
					/*filename = filename.replace(/ /g, "_");*/
					console.log(filename)
					var nuevoNombre = re+"-"+serie+folio;
					if(result.ConsultaResult.Estado == 'Vigente'){
						fs.copy(filename, "../logic/valid/"+nuevoNombre+".xml", { replace: true },function (err) {
							if (err) {
								throw err;
							}
							console.log("Moved "+filename+" to valid");
							fs.rmrfSync(filename);
						});
						/* SE RENOMBRA EL PDF */
						/* 	SE CREA EL ARCHIVO TXT*/
						fs.writeFile("../logic/valid/"+nuevoNombre+".txt", JSON.stringify(result), function(err){
							if (err) {
								throw err;
							}
							console.log("Created "+"../logic/valid/"+re+"-"+serie+folio+".txt"+" to valid");
						})
						fs.renameSync(filename.replace('../logic/new/','../logic/pdf/').replace(".xml",".pdf"), "../logic/pdf/"+nuevoNombre+".pdf")
					}else if(result.ConsultaResult.CodigoEstatus.search(/601/) > -1){
						console.log("ERROR 601")
						fs.copy(filename, "../logic/error/"+nuevoNombre+".xml", { replace: true },function (err) {
							if (err) {
								throw err;
							}
							console.log("Moved "+filename+" to error");
							fs.rmrfSync(filename);
						});
						fs.writeFile("../logic/error/"+nuevoNombre+".txt", JSON.stringify(result), function(err){
							if (err) {
								throw err;
							}
							console.log("Created "+"../logic/error/"+nuevoNombre+".txt"+" to valid");
						})
					}else if(result.ConsultaResult.CodigoEstatus.search(/602/) > -1){
						console.log("ERROR 601")
						fs.copy(filename, "../logic/error/"+nuevoNombre+".xml", { replace: true },function (err) {
							if (err) {
								throw err;
							}
							console.log("Moved "+filename+" to error");
							fs.rmrfSync(filename);
						});
						fs.writeFile("../logic/error/"+nuevoNombre+".txt", JSON.stringify(result), function(err){
							if (err) {
								throw err;
							}
							console.log("Created "+"../logic/error/"+nuevoNombre+".txt"+" to valid");
						})
					}
				});
			})
		}
	});
});




