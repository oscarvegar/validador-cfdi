var mailcfg = require("../config/mail-cfg").mailConfig;
module.exports = {
	deleteMail : function(seqno){
		var Imap = require('imap');
		var imap = new Imap({
		  user: mailcfg.username,
		  password: mailcfg.password,
		  host: mailcfg.host,
		  port: mailcfg.port, // imap port
		  tls: mailcfg.tls,
		});
		imap.once('ready', function() {
			imap.openBox('INBOX', false, function(err,box){
				if(err)console.log("NO SE PUDO ABRIR INBOX")
				console.log("BANDEJA ABIERTA")
				imap.search([ 'UNSEEN'], function(err, results) {
					console.log(results)
					imap.seq.addFlags(seqno,'DELETED',function(err){
		            	if(err)console.log("ERROR AL BORRAR ::::: ",err);
		            	imap.closeBox(function(err){
		            		if(err)console.error(err);
		            		imap.end();
		            	});
		          	})
				})
				
			});
		})
		imap.once('end', function() {
		  console.log('Connection ended');
		});
		imap.connect();
	}
}

