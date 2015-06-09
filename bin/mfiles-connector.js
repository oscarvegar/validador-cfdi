var Client = require('node-rest-client').Client;
var fs = require('fs');
var watch = require('node-watch'); 
var mfilesCfg = require("../config/mfiles-cfgdes");
var parseString = require('xml2js').parseString;
var unirest = require('unirest');

client = new Client();
var auth = null;

client.registerMethod("authenticationtokens",mfilesCfg.mfilesConfig.authenticationTokensURL,"POST");
client.registerMethod("createObject",mfilesCfg.mfilesConfig.createObjectURL,"POST");
client.registerMethod("files",mfilesCfg.mfilesConfig.uploadFilesURL,"POST");
client.registerMethod("createVendor",mfilesCfg.mfilesConfig.createVendorURL+mfilesCfg.mfilesConfig.customerList,"POST");


console.log("OBSERVANDO CARPETA logic/valid")
watch('../logic/valid/', {recursive: false},function(filename) {
	console.info("* * * INCOMING * * *",filename)
	if(filename.search(/.xml/)<0)
		return;
	if(!fs.existsSync(filename)){
		return
	}
	var args = {
	  headers:{"Content-Type": "application/json"} 
	};
	args.data = mfilesCfg.mfilesConfig.loginInfo;
	console.info("* * * AUTENTICANDO * * *",filename)
	client.methods.authenticationtokens(args,function(data,response){
		console.info("* * * AUTENTICADO * * *",filename)
		data = JSON.parse(data);
		auth = data.Value;
		var singleFilename = filename.replace("..\\logic\\valid\\","")
									.replace("../logic/valid/","")
									.replace(".xml","");
		console.info("***** SINGLE FILENAME *****",singleFilename );
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
  			vendorName = vendorName?vendorName:rfcEmisor;
  			var domFiscal = {};
  			if(result['cfdi:Comprobante']['cfdi:Emisor'][0]['cfdi:DomicilioFiscal'])
  				domFiscal = result['cfdi:Comprobante']['cfdi:Emisor'][0]['cfdi:DomicilioFiscal'][0]['$'];
  			var rfcReceptor = result['cfdi:Comprobante']['cfdi:Receptor'][0]['$']['rfc'];
			client.methods.files(args,function(data,response){
				console.info("* * * SUBIENDO ARCHIVOS * * *",filename)
				xmlFILE = JSON.parse(data);
				var existePDF = fs.existsSync("../logic/pdf/"+singleFilename+".pdf");
				if(existePDF){
					unirest.post(mfilesCfg.mfilesConfig.uploadFilesURL)
					.headers({"Content-Type": "application/octet-stream","X-Authentication":auth})
					.attach('file', "../logic/pdf/"+singleFilename+".pdf") // Attachment
					.end(function (response) {
					  pdfFILE = response.body;
					  createObject(serie,rfcEmisor,uuid,folio,xmlFILE,txtFILE,pdfFILE,fileRes,singleFilename,vendorName,domFiscal,rfcReceptor)
					});
				}else{
					createObject(serie,rfcEmisor,uuid,folio,xmlFILE,txtFILE,null,fileRes,singleFilename,vendorName,domFiscal,rfcReceptor)
				}
			})

		});
		
	});
});

function createObject(serie,rfcEmisor,uuid,folio,xmlFILE,txtFILE,pdfFILE,fileRes,singleFilename,vendorName,domFiscal,rfcReceptor){
	args = {
			headers:{"Content-Type": "application/octet-stream","X-Authentication":auth},
			data:fileRes
	};
	client.methods.files(args,function(data,response){
		var fileObject = JSON.parse(fileRes);
		txtFILE = JSON.parse(data);
		args = {
	 		headers:{"Content-Type": "application/octet-stream","X-Authentication":auth}
		};
		console.info("URL",mfilesCfg.mfilesConfig.queryObject+"?q="+rfcEmisor+"&o="+mfilesCfg.mfilesConfig.customerList+"&d=false")
		client.get(mfilesCfg.mfilesConfig.queryObject+"?q="+rfcEmisor+"&o="+mfilesCfg.mfilesConfig.customerList+"&d=false", args, function(datosProveedor, responses){
			datosProveedor = JSON.parse(datosProveedor);
			//console.log("DATOS PROVEEDOR",datosProveedor)
			var proveedorID = null;
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
	        console.info("singleFilename",singleFilename)
	        args = {
		 		headers:{"Content-Type": "application/json","X-Authentication":auth},
		 		data:{
		            PropertyValues: [{
		                    PropertyDef: 0,
		                    TypedValue: { DataType: 1, Value: singleFilename }
		                }, {
		                    PropertyDef: 22,
		                    TypedValue: { DataType: 8, Value: false }
		                }, {
		                    PropertyDef: 100,
		                    TypedValue: { DataType: 9, Lookup: { Item: mfilesCfg.mfilesConfig.clase } }
		                },{
		                    PropertyDef: mfilesCfg.mfilesConfig.numeroFactura.id,
		                    TypedValue: { DataType: mfilesCfg.mfilesConfig.numeroFactura.tipo, Value: folio?folio:0 }
		                },{
		                    PropertyDef: mfilesCfg.mfilesConfig.rfc,
		                    TypedValue: { DataType: 1, Value: rfcEmisor }
		                },{
		                    PropertyDef: mfilesCfg.mfilesConfig.serie,
		                    TypedValue: { DataType: 1, Value: serie?serie:"NA" }
		                },{
		                    PropertyDef: mfilesCfg.mfilesConfig.uid,
		                    TypedValue: { DataType: 1, Value: uuid }
		                },{
		                    PropertyDef: mfilesCfg.mfilesConfig.estadoSatPD,
		                    TypedValue: { DataType: 9, Lookup: { Item: respuestaWS }}
		                },{
		                    PropertyDef: mfilesCfg.mfilesConfig.rfcReceptor,
		                    TypedValue: { DataType: 1, Value: rfcReceptor }
		                },{
		                    PropertyDef: mfilesCfg.mfilesConfig.fechaDocto,
		                    TypedValue: { DataType: 5, Value: new Date() }
		                }
		                ],
		            Files: filesUP
	        	}
	        }

			/*** SE HACE UN QUERY A VER SI EXISTE EL ARCHIVO Y SE BORRA **/
	        client.get(mfilesCfg.mfilesConfig.queryObject+"?q="+singleFilename+"&o=0", 
        	{headers:{"Content-Type": "application/octet-stream","X-Authentication":auth}}, 
        	function(archivosBus, responses){
        		archivosBus = JSON.parse(archivosBus);
        		for(var i in archivosBus.Items){
					console.info("***** BUSQUEDA EXISTENTE *****",archivosBus.Items[i].Title)
        			client.post(mfilesCfg.mfilesConfig.createVendorURL
	    				+archivosBus.Items[i].ObjVer.Type
	    				+"/"
	    				+archivosBus.Items[i].ObjVer.ID
	    				+"/deleted?_method=PUT",
    					{headers:{"Content-Type": "application/octet-stream","X-Authentication":auth},data:"true"},
	    				function(resDelete,responses){
	    					console.info("***** BORRADO *****",JSON.stringify(resDelete))
						}
					);
    			}
    		});
		

	        if(datosProveedor.Items.length>0){
	        	var objectList;
	        	for(var i=0;i<datosProveedor.Items.length;i++){
	        		if(datosProveedor.Items[i].ObjVer.Type == mfilesCfg.mfilesConfig.customerList){
	        			objectList = datosProveedor.Items[i];
	        			break;
	        		}
	        	}
	        	proveedorID = objectList.ObjVer.ID;
				args.data.PropertyValues.push({PropertyDef: mfilesCfg.mfilesConfig.customer,
		                    TypedValue: { DataType: 10, Lookups: [{ Item: proveedorID }]  }
		                });

				
				client.methods.createObject(args,function(data,response){
			    		if(response.statusCode==200){
							console.info("***** SE CREO NUEVA FACTURA MFILES *****\n ***** ELIMINANDO ARCHIVOS *****",data.toString());
			    			eliminar("../logic/valid/"+singleFilename+".xml"
				    				,"../logic/pdf/"+singleFilename+".pdf"
				    				,"../logic/valid/"+singleFilename+".txt");
			    		}else
							console.error("XXXXX OCURRIO UN ERROR EN LA CREACION DE FACTURA XXXXX",data.toString())
				});
			}else{
				var argsProv = {
					headers:{"Content-Type": "application/json","X-Authentication":auth},
					data:{
					    PropertyValues: [
					    	{
			                    PropertyDef: 100,
			                    TypedValue: { DataType: 9, Lookup: { Item: mfilesCfg.mfilesConfig.claseProveedor } }
			                },
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.rfc,
						        TypedValue: { DataType: 1, Value:rfcEmisor }
					    	},
					    	/*{
						        PropertyDef: mfilesCfg.mfilesConfig.corporativo,
						        TypedValue: { DataType: 8, Value:true }
					    	},*/
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.vendorName,
						        TypedValue: { DataType: 1, Value:vendorName?vendorName:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.calleProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.calle?domFiscal.calle:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.noExteriorProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.noExterior?domFiscal.noExterior:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.noInteriorProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.noInterior?domFiscal.noInterior:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.coloniaProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.colonia?domFiscal.colonia:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.paisProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.pais?domFiscal.pais:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.estadoProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.estado?domFiscal.estado:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.ciudadProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.municipio?domFiscal.municipio:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.localidadProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.localidad?domFiscal.localidad:"NA"}
					    	},
					    	{
						        PropertyDef: mfilesCfg.mfilesConfig.codigoPostalProveedor,
						        TypedValue: { DataType: 1, Value:domFiscal.codigoPostal?domFiscal.codigoPostal:"NA"}
					    	}]
			    	}
			    }
			    client.methods.createVendor(argsProv,function(data,response){
			    	if(response.statusCode==200){
			    		console.info("***** SE CREO NUEVO PROVEEDOR *****",data.toString())
				    	proveedorID = JSON.parse(data).ObjVer.ID;
				    	args.data.PropertyValues.push({PropertyDef: mfilesCfg.mfilesConfig.customer,
		                    TypedValue: { DataType: 10, Lookups: [{ Item: proveedorID }]  }
		                });
				    	client.methods.createObject(args,function(data,response){
				    		if(response.statusCode==200){
								console.info("***** SE CREO NUEVA FACTURA MFILES *****",data.toString())
				    			console.info("***** ELIMINANDO ARCHIVOS *****");
				    			eliminar("../logic/valid/"+singleFilename+".xml"
				    				,"../logic/pdf/"+singleFilename+".pdf"
				    				,"../logic/valid/"+singleFilename+".txt");
				    			
				    		}else
								console.error("XXXXX OCURRIO UN ERROR EN LA CREACION DE FACTURA XXXXX",data.toString())
						});
			    	}else{
			    		console.error("XXXXX OCURRIO UN ERROR EN LA CREACION DEL PROVEEDOR XXXXX",data.toString())
			    	}
			    })
			}
	    });
	});
}

function eliminar(){
	 for (var i = 0; i < arguments.length; i++){
	 	console.info("***** ELIMINANDO:",arguments[i]);
		fs.unlink(arguments[i], function(args){})
	}
}