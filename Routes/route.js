import express from 'express'

/* import all controllers */
import * as controller from '../controllers/controllers.js'
import { registerMail } from '../controllers/mailer.js'
import Auth, { localVariables } from '../middleware/auth.js'
const router = express.Router()

/* POST Methods */
router.post('/register', controller.register) /*register user */
router.post('/registerMail', registerMail) // send the email
router.post('/authenticate', controller.verifyUser, (req, res, next) => {
  res.end()
}) // authenticate user
router.post('/login', controller.verifyUser, controller.login) // login in app

/* GET METHODS */
router.get('/user/:username', controller.getUser) // user with username
router.get(
  '/generateOTP',
  controller.verifyUser,
  localVariables,
  controller.generateOTP,
) // generate random OTP
router.get('/verifyOTP', controller.verifyUser, controller.verifyOTP) // verify generated OTP
router.get('/createResetSession', controller.createResetSession) // reset all the variables

/* PUT Methods */
router.put('/updateuser', Auth, controller.updateUser) // is use to update the user profile
router.put('/resetPassword',controller.resetPassword) // use to reset password

export default router
