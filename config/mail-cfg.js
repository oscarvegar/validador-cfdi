exports.mailConfig = {
  username: "oscarman2001@hotmail.com",
  password: "mifoco1",
  host: "imap-mail.outlook.com",
  port: 993, // imap port 
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX", // mailbox to monitor 
  searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved 
  markSeen: false, // all fetched email willbe marked as seen and not fetched next time 
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 
  //mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib. 
  attachments: true//, // download attachments as they are encountered to the project directory 
  //attachmentOptions: { directory: "../logic/attachments/" } // specify a download directory for attachments 
};