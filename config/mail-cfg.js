exports.mailConfig = {
  username: "factest@grupointecsa.com.mx",
  password: "MFiles2015",
  host: "mail.grupointecsa.com.mx",
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
    host:"mail.grupointecsa.com.mx",
    port:26,
    secure: true,
    ignoreTLS:true,
    auth: {
        user: '"factest@grupointecsa.com.mx"',
        pass: 'MFiles2015'
    }
}

exports.mailOptions = {
    from: 'Validador Factura <factest@grupointecsa.com.mx>', // sender address
    to: 'oscarman2001@hotmail.com', // list of receivers
    subject: 'Factura Inválida', // Subject line
    //text: 'Factura Inválida', // plaintext body
    //html: '<b>La factura</b>' // html body
}
