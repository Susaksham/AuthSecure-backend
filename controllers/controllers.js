import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ENV from '../config.js'
import otpGenerator from 'otp-generator'
import * as dotenv from 'dotenv';
dotenv.config()

/* middleware to verify the user */
export async function verifyUser(req, res, next) {
  try {
    const { username } = req.method === 'GET' ? req.query : req.body
    let exist = await UserModel.findOne({ username })
    if (!exist) {
      return res.status(404).json({ error: 'Username not found' })
    }
    
    next()
  } catch (err) {
    return res.status(404).send({ error: 'Authentication error' })
  }
}

/* POST: http://localhost:8080/api/register 
    * @param : {
        "username" : "example123",
        "password" : "admin123",
        "email" : "example@gmail.com",
        "firstName" : "bill",
        "lastName" : "william",
        "mobile" : 2232323233,
        "address" : "address",
        "profile": "image base64"
    }

*/

export async function register(req, res) {
  try {
    const { username, password, email, profile } = req.body

    // check the existing user

    const existUsername = new Promise((resolve, reject) => {
      UserModel.findOne({ username })
        .then((user) => {
          if (user) {
            reject({ error: 'Please use unique username' })
          }

          resolve()
        })
        .catch((err) => {
          reject(new Error(err))
        })
    })

    // check for the existing email
    const existEmail = new Promise((resolve, reject) => {
      UserModel.findOne({ email })
        .then((mail) => {
          if (mail) {
            reject({ error: 'Please use unique email' })
          }

          resolve()
        })
        .catch((err) => {
          if (err) {
            reject(new Error(err))
          }
        })
    })
    await Promise.all([existUsername, existEmail])
      .then(() => {
        if (password) {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              const user = new UserModel({
                username,
                password: hashedPassword,
                profile: profile || '',
                email,
              })
              // return save result as a response
              user
                .save()
                .then((result) => {
                 
                  res.status(201).send({ msg: 'User Register Successfully ' })
                })
                .catch((error) => {
                 
                  res.status(500).send({ error })
                })
            })
            .catch((err) => {
              return res.status(500).send({
                error: 'Unable to hashed password',
              })
            })
        }
      })
      .catch((error) => {
        return res.status(500).send({
          error,
        })
      })
  } catch (err) {
    return res.status(500).send(err)
  }
}

/** POST: http://localhost:8080/api/login 
    * @param : {
        "username" : 'example123"
        "password" : "admin123",
        
    } */
export async function login(req, res) {
  const { username, password } = req.body
  
  try {
    UserModel.findOne({ username })
      .then((user) => {
   
        bcrypt
          .compare(password, user.password)
          .then((passwordCheck) => {
           
            if (!passwordCheck)
              return res.status(400).send({ error: "Don't have password" })

            // create jwt token
            const token = jwt.sign(
              {
                userId: user._id,
                username: user.username,
              },
              process.env.JWT_SECRET,
              { expiresIn: '24h' },
            )
      
            return res.status(200).send({
              msg: 'Login Successfull..!',
              username: user.username,
              token,
            })
          })
          .catch((error) => {
            return res.status(400).send({ error: 'Wrong Passowrd' })
          })
      })
      .catch((err) => {
        return res.status(404).send({ error: 'Username not found' })
      })
  } catch (error) {
    return res.status(500).send({ error })
  }
}

/** GET: http://localhost:8080/api/user/example123
 */
export async function getUser(req, res) {
  try {
    const user = req.params
    if (!user) {
      return res.status(501).send({ error: 'Invalid Username' })
    }
   
    const existUser = await UserModel.findOne({ username: user.username })
    if (!existUser) {
      return res.status(404).json({ error: ' User not found' })
    }
    // const obj = Object.assign({}, existUser.JSON())
    return res.status(201).send(existUser)
  } catch (err) {
    return res.status(404).json({ error: 'Cannot find the user' })
  }
}

/* PUT : http://localhost:8080/api/updateuser
    * @param : {
        "id" : "<userid>"
    }
    body : {
        firstName : '',
        address : '',
        profile : ''
    }
*/
export async function updateUser(req, res) {
  try {
    // const id = req.query.id
    const { userId } = req.user
    
   
    let userExist = await UserModel.findById(userId)
   
    if (userExist) {
      const body = req.body
      
      const updateUser = await UserModel.updateOne({ _id: userId }, body)
      return res.status(201).json({ message: 'Record Updated...' })
    } else {
      return res.status(401).send({ error: 'User not found...!' })
    }
  } catch (error) {
    return res.status(401).send({ error })
  }
}
/* GET: http://localhost:8080/api/generateOTP */
export async function generateOTP(req, res) {
  req.app.locals.OTP = await otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  })
  res.status(201).send({ code: req.app.locals.OTP })
}

/* GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req, res) {
  const code = req.query.code

  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null // reeset the otp
    req.app.locals.resetSession = true // start session for reset password
   
    return res.status(201).send({ msg: 'Verify Successfully' })
  }
  return res.status(400).send({ error: 'Invalid OTP' })
}

// successfully redirect user when OTP is valid
/* GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req, res) {

  if (req.app.locals.resetSession) {
    // req.app.locals.resetSession = false // allow access to this route only once
    return res.status(201).send({ flag: req.app.locals.resetSession })
  }
  return res.status(404).send({ error: 'Session expired!' })
}

// udpate the password when we have valid session
/* PUT: http://localhost:8080/api/resetPassword */
export async function resetPassword(req, res) {
  try {
    if (!req.app.locals.resetSession) {

      return res.status(404).send({ error: 'Session expired!' })
    }
    const { username, password } = req.body
    try {
      UserModel.findOne({ username })
        .then((user) => {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              UserModel.updateOne(
                { username: user.username },
                { password: hashedPassword },
              )
                .then((updated) => {
                  req.app.locals.resetSession = false
                  return res.status(201).send({ msg: 'Record updated' })
                })
                .catch((err) => {
                  req.app.locals.resetSession = false
                  return res
                    .status(500)
                    .send({ error: 'not able to change password and username' })
                })
            })
            .catch((error) => {
              return res
                .status(500)
                .send({ error: 'Unable to hashed password' })
            })
        })
        .catch((error) => {
     
          return res.status(404).send({ error: 'Username not found' })
        })
    } catch (error) {
      return res.status(500).send({ error })
    }
  } catch (error) {
    return res.status(401).send({ error })
  }
}
