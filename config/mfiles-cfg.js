var _host = "http://ipisamexico.dyndns.org:81";
exports.mfilesConfig = {
    /* CLASE DE LA FACTURUA */
    clase:2,
    /* PROPIEDAD DE PROVEEDOR */
    customer:1142,
    /* FECHA DE LA FACTURUA */
    fechaDocto:1002,
    /* SERIE DE LA FACTURA */
    serie:1281,
  	/* FOLIO DE LA FACTURA */
  	numeroFactura:{id:1171,tipo:1},
   
    /* RFC EMISOR */
    rfc:1206,
    /*ID DEL VALUE LIST DE ESTADOS DE SAT*/
    estadoSatPD:1283,
    /* UID DE LA FACTURA */
  	uid:1284,
    /* RFC RECEPTOR */
    rfcReceptor:1285,
    /*PROPIEDAD CORPORATIVO DE LA CLASE PROVEEDOR*/
    corporativo:1183,


    /*CLASE DEL PROVEEDOR*/
    claseCliente:93,
    /*RAZON SOCIAL PROVEEDOR*/
    nombreCliente:1143,
    /*CLASE DEL PROVEEDOR*/
    claseProveedor:93,
    /*PROPIEDAD NOMBRE DEL PROVEEDOR*/
    vendorName:1143,
    /*CALLE DEL PROVEEDOR*/ 

    calleProveedor:1144,
    /*NO EXTERIOR DEL PROVEEDOR*/
    noExteriorProveedor:1278,
    /*NO INTERIOR DEL PROVEEDOR*/
    noInteriorProveedor:1279,
    /*COLONIA DEL PROVEEDOR*/
    coloniaProveedor:1145,
    /*CODIGOPOSTAL DEL PROVEEDOR*/
    codigoPostalProveedor:1087,
    /*LOCALIDAD DEL PROVEEDOR*/
    localidadProveedor:1147,
    /*CIUDAD DEL PROVEEDOR*/
    ciudadProveedor:1280,
    /*ESTADO DEL PROVEEDOR*/
    estadoProveedor:1149,
    /*PAIS DEL PROVEEDOR*/
    paisProveedor:1148,
    /*ID DEL VALUE LIST DE PROVEEDORES*/
    customerList:160,
    /*POSIBLES ESTADOS DEL SAT */
  	estadoSat:{OK:1,INVALIDO:2,NOENCONTRADO:3},
    loginInfo : { username: "Administrator",password:"+ipiwax-66",VaultGuid: "DCCE53CE-4CD7-4B4C-9A73-7C77CD38991D" },
    //loginInfo : { username: "Ovega",password:"Intecsa12*",VaultGuid: "3A7EFDC2-BF4C-4CCB-8994-FC5D59606F56" },
    authenticationTokensURL:_host+"/REST/server/authenticationtokens",
    createObjectURL:_host+"/REST/objects/0",
    createVendorURL:_host+"/REST/objects/",
    uploadFilesURL:_host+"/REST/files",   
    queryObject:_host+"/REST/objects" ,  
    queryValueLists:_host+"/REST/valuelists/" ,

    /*CAMPOS ESPECIALES PARA IPISA
        A PARTE DEL RFC RECEPTOR TAMBIEN SETEAR EL NOMBRE DE LA EMPRESA, ES UNA LISTA
        MANDAR CORREO DE FACTURA INVALIDA SI NO ES EL RFC PERO SE PARECE
        CUANDO SEAN REPETIDOS SOBRE ESCRIBIR EL ARCHIVO
        MOVER LOS ARCHIVOS DE LA BANDEJA DE ENTRADA A OTRA CARPETA.
        SI LLEGA SOLO EL XML PROCESARLO Y MANDAR UNA NOTIFICACION DE QUE FALTÓ EL PDF,
            PERO SI SE DEBE PROCESAR.
        CUANDO YA SE MANDEN LOS ARCHIVOS A MFILES ELIMINARLOS DE LA CARPETA LOGIC/VALID
    */
};