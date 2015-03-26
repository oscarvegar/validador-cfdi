var Client = require('node-rest-client').Client;
var fs = require('fs');
var watch = require('node-watch'); 
var mfilesCfg = require("../config/mfiles-cfg");
var parseString = require('xml2js').parseString;
var unirest = require('unirest');

client = new Client();
var auth = null;

client.registerMethod("authenticationtokens",mfilesCfg.mfilesConfig.authenticationTokensURL,"POST");
client.registerMethod("createObject",mfilesCfg.mfilesConfig.createObjectURL,"POST");
client.registerMethod("files",mfilesCfg.mfilesConfig.uploadFilesURL,"POST");
client.registerMethod("createVendor",mfilesCfg.mfilesConfig.createVendorURL,"POST");

console.log("OBSERVANDO CARPETA logic/valid")
watch('../logic/valid/', {recursive: false},function(filename) {
	if(filename.search(/.xml/)<0)
		return;
	if(!fs.existsSync(filename)){
		return
	}
	var args = {
	  headers:{"Content-Type": "application/json"} 
	};
	args.data = mfilesCfg.mfilesConfig.loginInfo;
	client.methods.authenticationtokens(args,function(data,response){
		data = JSON.parse(data);
		auth = data.Value;
		var singleFilename = filename.replace("../logic/valid/","").replace(".xml","");

		var file = fs.readFileSync(filename,'utf8');
		var fileRes = fs.readFileSync(filename.replace(".xml",".txt"),'utf8');

		var xmlFILE,txtFILE,pdfFILE;
		parseString(file, function (err, result) {
			args = {
		 		headers:{"Content-Type": "application/octet-stream","X-Authentication":auth},
		 		data:file
			};
			var serie = result['cfdi:Comprobante']['$']['serie'];
			var rfcEmisor = result['cfdi:Comprobante']['cfdi:Emisor'][0]['$']["rfc"];
  			var uuid = result['cfdi:Comprobante']['cfdi:Complemento'][0]['tfd:TimbreFiscalDigital'][0]['$']['UUID'];
  			var folio = result['cfdi:Comprobante']['$']['folio'];
  			var vendorName = result['cfdi:Comprobante']['cfdi:Emisor'][0]['$']["nombre"];
			console.log("LLAMA A FILES: ")
			//console.log(args)
			client.methods.files(args,function(data,response){
				console.log(data);
				xmlFILE = JSON.parse(data);
				var existePDF = fs.existsSync("../logic/pdf/"+singleFilename+".pdf");
				if(existePDF){
					unirest.post('http://mfiles-gi.cloudapp.net/REST/files')
					.headers({"Content-Type": "application/octet-stream","X-Authentication":auth})
					.attach('file', "../logic/pdf/"+singleFilename+".pdf") // Attachment
					.end(function (response) {
						console.log(response.body)
					  pdfFILE = response.body;
					  createObject(serie,rfcEmisor,uuid,folio,xmlFILE,txtFILE,pdfFILE,fileRes,singleFilename,vendorName)
					});
				}else{
					createObject(serie,rfcEmisor,uuid,folio,xmlFILE,txtFILE,null,fileRes,singleFilename,vendorName)
				}
			})

		});
		
	});
});

function createObject(serie,rfcEmisor,uuid,folio,xmlFILE,txtFILE,pdfFILE,fileRes,singleFilename,vendorName){
	args = {
			headers:{"Content-Type": "application/octet-stream","X-Authentication":auth},
			data:fileRes
	};
	client.methods.files(args,function(data,response){
		var fileObject = JSON.parse(fileRes);
		console.log(data);
		txtFILE = JSON.parse(data);
		args = {
	 		headers:{"Content-Type": "application/octet-stream","X-Authentication":auth}
		};
		client.get("http://mfiles-gi.cloudapp.net/REST/objects/"+mfilesCfg.mfilesConfig.customerList+"?q="+rfcEmisor, args, function(datosProveedor, responses){
			datosProveedor = JSON.parse(datosProveedor);
			var proveedorID = null;
			//console.log(datosProveedor)
			var filesUP = [{UploadID:xmlFILE.UploadID,Title:singleFilename,Extension:"xml",Size:xmlFILE.Size},
		            		{UploadID:txtFILE.UploadID,Title:singleFilename,Extension:"txt",Size:txtFILE.Size}];
	        if(pdfFILE!=null){
	        	filesUP.push({UploadID:pdfFILE.UploadID,Title:singleFilename,Extension:"pdf",Size:pdfFILE.Size});
	        }
	        var respuestaWS = 0;
	        if(fileObject.status === 0)
	        	respuestaWS = mfilesCfg.mfilesConfig.estadoSat.OK 
	        else if(fileObject.status === -1)
	        	respuestaWS = mfilesCfg.mfilesConfig.estadoSat.INVALIDO 
	        else if(fileObject.status === -2)
	        	respuestaWS = mfilesCfg.mfilesConfig.estadoSat.NOENCONTRADO 
	        args = {
		 		headers:{"Content-Type": "application/json","X-Authentication":auth},
		 		data:{
		            PropertyValues: [{
		                    // Document name
		                    PropertyDef: 0,
		                    TypedValue: { DataType: 1, Value: singleFilename }
		                }, {
		                    // "Single File" property
		                    PropertyDef: 22,
		                    TypedValue: { DataType: 8, Value: false }
		                }, {
		                    // Class.
		                    PropertyDef: 100,
		                    TypedValue: { DataType: 9, Lookup: { Item: mfilesCfg.mfilesConfig.clase } }
		                },{
		                    // NUMERO FACTURA.
		                    PropertyDef: mfilesCfg.mfilesConfig.numeroFactura,
		                    TypedValue: { DataType: 1, Value: folio }
		                },{
		                    // RFC.
		                    PropertyDef: mfilesCfg.mfilesConfig.rfc,
		                    TypedValue: { DataType: 1, Value: rfcEmisor }
		                },{
		                    // SERIE.
		                    PropertyDef: mfilesCfg.mfilesConfig.serie,
		                    TypedValue: { DataType: 1, Value: serie }
		                },{
		                    // UID.
		                    PropertyDef: mfilesCfg.mfilesConfig.uid,
		                    TypedValue: { DataType: 1, Value: uuid }
		                },{
		                    // ESTADO SAT.
		                    PropertyDef: mfilesCfg.mfilesConfig.estadoSatPD,
		                    TypedValue: { DataType: 9, Lookup: { Item: respuestaWS }}
		                }],
		            Files: filesUP
	        	}
	        }
	        if(datosProveedor.Items.length>0){
	        	proveedorID = datosProveedor.Items[0].ObjVer.ID;
				args.data.PropertyValues.push({PropertyDef: mfilesCfg.mfilesConfig.customer,
		                    TypedValue: { DataType: 10, Lookups: [{ Item: proveedorID }]  }
		                });

				client.methods.createObject(args,function(data,response){
					console.log(data);
				});
			}else{
				var argsProv = {
					headers:{"Content-Type": "application/json","X-Authentication":auth},
					data:{
					    PropertyValues: [
					    	{
			                    // Class.
			                    PropertyDef: 100,
			                    TypedValue: { DataType: 9, Lookup: { Item: 98 } }
			                },
					    	{
					            // RFC
						        PropertyDef: 1164,
						        TypedValue: { DataType: 1, Value:rfcEmisor }
					    	},
					    	{
					            // Corporate?
						        PropertyDef: 1183,
						        TypedValue: { DataType: 8, Value:true }
					    	},
					    	{
					            // Name
						        PropertyDef: 1110,
						        TypedValue: { DataType: 1, Value:vendorName}
					    	}]
			    	}
			    }
			    client.methods.createVendor(argsProv,function(data,response){
			    	proveedorID = JSON.parse(data).ObjVer.ID;
			    	args.data.PropertyValues.push({PropertyDef: mfilesCfg.mfilesConfig.customer,
	                    TypedValue: { DataType: 10, Lookups: [{ Item: proveedorID }]  }
	                });
			    	client.methods.createObject(args,function(data,response){
						console.log(data);
					});
			    })
			}
	        
	    });
	});
}