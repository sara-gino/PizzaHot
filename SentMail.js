var nodemailer = require('nodemailer');

exports.email = function (email,userName,act) {
    var transporter = nodemailer.createTransport({
        service: 'gmail.com',
        auth: {
            user: 'projectstore.nodejs@gmail.com',
            pass: 'Project1368'
        }
    });
    var mailOptions = {
        from: 'projectstore.nodejs@gmail.com',
        to:email,
        subject: 'Sending an email from a store node js',
        text: 'hi '+userName+' You have successfully '+act
    }
transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.log(error);
    } else {
        console.log('sent email!')
    }
})
}
