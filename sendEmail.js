var nodemailer = require('nodemailer');

var username = process.env.GMAIL_USERNAME;
var password = process.env.GMAIL_PASSWORD;

var transporter = nodemailer.createTransport('smtps://' + username + '%40gmail.com:' + password + '@smtp.gmail.com');

module.exports = function(to, filePath){

  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: '"kindle-me" <' + username + '@gmail.com>', // sender address
    to: to, // list of receivers
    subject: 'kindle me', // Subject line
    text: 'Read more.', // plaintext body
    html: '<p>Read more.</p>', // html body
    attachments: [{
      path: filePath
    }]
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });

};
