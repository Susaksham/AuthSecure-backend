import nodemailer from 'nodemailer'
import Mailgen from 'mailgen'
import * as dotenv from 'dotenv';
dotenv.config()
import ENV from '../config.js'

//https://ethereal.email/create

let nodeConfig = {
  service: 'gmail',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL, // generated ethereal user
    pass: process.env.PASSWORD, // generated ethereal password
  },
}

let transporter = nodemailer.createTransport(nodeConfig)

let MailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'Mailgen',
    link: 'https://mailgen.js/',
  },
})

/** POST: http://localhost:8080/api/registerMail 
    * @param : {
        "username" : 'example123",
        "userEmail" : "admin123",
        "text" : '",
        "subject" : ""

        
    } */
export const registerMail = async (req, res) => {
  const { username, userEmail, text, subject } = req.body


  // body of the email
  var email = {
    body: {
      name: username,
      intro: `${text}` || 'This is my authentication',
      outro: 'Need help , or have question? Just reply to this email.',
    },
  }
  var emailbody = MailGenerator.generate(email)
  let message = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: subject || 'Signup Successfull',
    html: emailbody,
  }
  transporter
    .sendMail(message)
    .then((info) => {
      return res.status(200).send({
        msg: 'You should receive an email from us.',
        info: info.messageId,
        preview: nodemailer.getTestMessageUrl(info),
      })
    })
    .catch((error) => [res.status(500).send({ error })])
}
