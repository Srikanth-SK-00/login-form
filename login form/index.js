
var express = require("express")
const nodemailer = require("nodemailer")
const generateotp = require("otp-generator")
var mongoose = require("mongoose")
const app = express();

const bcrypt = require('bcrypt')
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))

mongoose.connect('mongodb://localhost/form');
var db = mongoose.connection;
db.on('error', () => console.log("db err"));
db.once('open', () => console.log("connect database"))

app.post("/sign_up", async (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var phno = req.body.phno;
  const hashedpassword = await bcrypt.hash(req.body.password, 10)
  var data = {
    "name": name,
    "email": email,
    "phno": phno,
    "password": hashedpassword
  }
  db.collection('users').insertOne(data, (err, collection) => {
    if (err) {
      throw err;
    }

  });
  res.sendFile(__dirname + '/sucess.html');


})
app.post('/login', async (req, res) => {
  var username = req.body.name;

  db.collection('users').findOne({ name: username }, async function (err, result) {
    try {


      if (await bcrypt.compare(req.body.password, result.password)) {
        console.log("login sucess full");
        if (err) {
          throw err;
        }
        res.sendFile(__dirname + '/sucess.html');
      }
      else {
        return res.json({ message: 'wrong password' });

      }

    }
    catch {
      
      if (!result) {
        return res.json({ message: 'NO user found' });

        return;
      }
    }
  })
})

app.get("/", (req, res) => {
  res.sendFile(__dirname + '/index.html');


}).listen(3000);






function sendOTPByEmail(email, otp) {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '20tuec216@skct.edu.in',
      pass: 'srikanth@2003',
    },
  });

  
  const mailOptions = {
    from: '20tuec216@skc.edu.in',
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP: ${otp}`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

function genotp()
{
  const otp=generateotp.generate(6, { digits: true, alphabets: false, upperCaseAlphabets: false,lowerCaseAlphabets:false, specialChars: false });
return otp;
}

app.post('/generateotp', (req, res) => {
  const email = req.body.email;
  const otp=genotp();
  sendOTPByEmail(email,otp);
  console.log( 'OTP generated and sent successfully' );
  var data=
  {
    "otp":otp
  }
  db.collection('otps').insertOne(data, (err, collection) => {
    if (err) {
      throw err;
    }
  });

});


app.post('/verify',async(req, res) => {
  const  userotp  = req.body.otp;

  db.collection('otps').findOne({otp:userotp} ,async function (err, result) {
    try{
      if (userotp == result.otp) {
      return res.json({ message: 'OTP verified successfully' });
    } 
    db.dropCollection('otps');
    }
   
    catch
    {
      return res.json({ error: 'Invalid OTP' });
    }
    
  });


});
