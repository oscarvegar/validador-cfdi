exports.mailConfig = {
  //username: "factest@grupointecsa.com.mx",
  //password: "MFiles2015",
  //host: "mail.grupointecsa.com.mx",

  username: "facturacion@atomicware.mx",
  password: "f4ctur4c10n",
  host: "imap.zoho.com",
  port: 993, // imap port 
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX", // mailbox to monitor 
  searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved 
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time 
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 
  //mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib. 
  attachments: true, // download attachments as they are encountered to the project directory 
  attachmentOptions: { directory: "../logic/attachments/" } // specify a download directory for attachments 
};

exports.transporterConfig = {
    //host:"mail.grupointecsa.com.mx",
    host:"smtp.zoho.com",
    //port:26,
    port:465,
    secure: true,
    ignoreTLS:true,
    auth: {
        //user: 'ovega@grupointecsa.com.mx',
        //pass: 'OV$2015'
        user: 'facturacion@atomicware.mx',
        pass: 'f4ctur4c10n'
    }
}

exports.mailOptions = {
    from: 'Validador Factura <factest@grupointecsa.com.mx>', // sender address
    to: 'oscarman2001@hotmail.com', // list of receivers
    subject: 'Factura Inválida', // Subject line
    //text: 'Factura Inválida', // plaintext body
    //html: '<b>La factura</b>' // html body
}
