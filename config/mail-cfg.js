exports.mailConfig = {
  username: "factest@grupointecsa.com.mx",
  password: "MFiles2015",
  host: "mail.grupointecsa.com.mx",
  port: 993, // imap port 
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  
  /*username: "facturacion@ipisamexico.com",
  password: "ipisa$2012#",
  host: "imap.ipisamexico.com",
  port: 143, // imap port 
  ssl: false,
  tlsOptions: { rejectUnauthorized: true },*/

  mailbox: "INBOX", // mailbox to monitor 
  searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved 
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time 
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 
  //mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib. 
  attachments: true, // download attachments as they are encountered to the project directory 
  attachmentOptions: { directory: "../logic/attachments/" } // specify a download directory for attachments 
};

exports.transporterConfig = {
    host:"smtp.ipisamexico.com",
    port:25,
    secure: false,
    ignoreTLS:true,
    auth: {
        user: 'facturacion@ipisamexico.com',
        pass: 'ipisa$2012#'
    }
}

exports.mailOptions = {
    from: 'Validador Factura <facturacion@ipisamexico.com>', // sender address
    to: 'oscarman2001@hotmail.com,oscarvegar@gmail.com', // list of receivers
    subject: 'Factura Inválida', // Subject line
    //text: 'Factura Inválida', // plaintext body
    //html: '<b>La factura</b>' // html body
}
