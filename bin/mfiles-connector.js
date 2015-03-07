var Client = require('node-rest-client').Client;
var fs = require('fs');
var watch = require('node-watch');

client = new Client();
var auth = null;

client.registerMethod("authenticationtokens","http://mfiles-gi.cloudapp.net/REST/server/authenticationtokens","POST");
client.registerMethod("authenticationtoken","http://mfiles-gi.cloudapp.net/REST/session/authenticationtoken","GET");
client.registerMethod("createObject","http://mfiles-gi.cloudapp.net/REST/objects/0","POST");
client.registerMethod("files","http://mfiles-gi.cloudapp.net/REST/files","POST");

var loginInfo = { username: "Administrator",password:"Intecsa12*",VaultGuid: "59E3E2C4-3B7A-4034-B8F6-88DCF894F2B6" };
console.log("OBSERVANDO CARPETA logic/valid")
watch('../logic/valid/', {recursive: false},function(filename) {
	var args = {
	  headers:{"Content-Type": "application/json"} 
	};
	args.data = loginInfo;
	client.methods.authenticationtokens(args,function(data,response){
		data = JSON.parse(data);
		auth = data.Value;
		var singleFilename = filename.replace("../logic/valid/","").replace(".xml","");
		var file = fs.readFileSync(filename).toString().replace(/\,+$/,'');
		args = {
	 		headers:{"Content-Type": "application/octet-stream","X-Authentication":auth},
	 		data:file
		};
		console.log("LLAMA A FILES: ")
		//console.log(args)
		client.methods.files(args,function(data,response){
			console.log(data);
			data = JSON.parse(data);
			args = {
		 		headers:{"Content-Type": "application/json","X-Authentication":auth},
		 		data:{
		            PropertyValues: [{
		                    // Document name
		                    PropertyDef: 0,
		                    TypedValue: { DataType: 1, Value: "FACTURA" }
		                }, {
		                    // "Single File" property
		                    PropertyDef: 22,
		                    TypedValue: { DataType: 8, Value: false }
		                }, {
		                    // Class.
		                    PropertyDef: 100,
		                    TypedValue: { DataType: 9, Lookup: { Item: 0 } }
		                }],
		            Files: [{UploadID:data.UploadID,Title:singleFilename,Extension:"xml",Size:data.Size}]
	        	}
	        }
			client.methods.createObject(args,function(data,response){
				console.log(data);
			});
		})
	});
});