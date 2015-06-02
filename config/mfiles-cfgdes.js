var _host = "http://mfiles-gi.cloudapp.net"; 
exports.mfilesConfig = {
    /* CLASE DE LA FACTURUA */
    clase:2,
    /* FECHA DE LA FACTURUA */
    fechaDocto:1002,
    /* PROPIEDAD DE PROVEEDOR */
  	customer:1079,
  	/* FOLIO DE LA FACTURA */
  	numeroFactura:1206,
    /* RFC EMISOR */
    rfc:1164,
    /* RFC RECEPTOR */
    rfcReceptor:1222,
    /* SERIE DE LA FACTURA */
  	serie:1205,
    /* UID DE LA FACTURA */
  	uid:1204,
    /*ID DEL VALUE LIST DE ESTADOS DE SAT*/
    estadoSatPD:1209,
    /*PROPIEDAD CORPORATIVO DE LA CLASE PROVEEDOR*/
    corporativo:1183,
    /*PROPIEDAD NOMBRE DEL PROVEEDOR*/
    vendorName:1223,
    /*CLASE DEL PROVEEDOR*/
    claseProveedor:98,
    /*CALLE DEL PROVEEDOR*/
    calleProveedor:1217,
    /*NO EXTERIOR DEL PROVEEDOR*/
    noExteriorProveedor:1218,
    /*NO INTERIOR DEL PROVEEDOR*/
    noInteriorProveedor:1219,
    /*COLONIA DEL PROVEEDOR*/
    coloniaProveedor:1201,
    /*CODIGOPOSTAL DEL PROVEEDOR*/
    codigoPostalProveedor:1087,
    /*LOCALIDAD DEL PROVEEDOR*/
    localidadProveedor:1202,
    /*CIUDAD DEL PROVEEDOR*/
    ciudadProveedor:1216,
    /*ESTADO DEL PROVEEDOR*/
    estadoProveedor:1214,
    /*PAIS DEL PROVEEDOR*/
    paisProveedor:1213,
    /*ID DEL VALUE LIST DE PROVEEDORES*/
    customerList:136,
    /*POSIBLES ESTADOS DEL SAT */
  	estadoSat:{OK:1,INVALIDO:2,NOENCONTRADO:3},
    loginInfo : { username: "Ovega",password:"Intecsa12*",VaultGuid: "3A7EFDC2-BF4C-4CCB-8994-FC5D59606F56" },
    //loginInfo : { username: "Administrator",password:"Intecsa12*",VaultGuid: "59E3E2C4-3B7A-4034-B8F6-88DCF894F2B6" },
    authenticationTokensURL:_host+"/REST/server/authenticationtokens",
    createObjectURL:_host+"/REST/objects/0",
    createVendorURL:_host+"/REST/objects/",
    uploadFilesURL:_host+"/REST/files",   
    queryObject:_host+"/REST/objects" ,  
    queryValueLists:_host+"/REST/valuelists/" ,
};