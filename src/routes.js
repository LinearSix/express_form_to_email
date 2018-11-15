
const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator/check')
const { matchedData } = require('express-validator/filter')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })
const nodemailer = require('nodemailer');

// render index page
router.get('/', (req, res) => {
  res.render('index')
})

// render contact page
router.get('/contact', (req, res) => {
  res.render('contact', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken()
  })
})

router.post('/contact', upload.single('photo'), [
  check('message')
    .isLength({ min: 1 })
    .withMessage('Message is required')
    .trim(),
  check('email')
    .isEmail()
    .withMessage('That email doesn‘t look right')
    .trim()
    .normalizeEmail()
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.render('contact', {
      data: req.body,
      errors: errors.mapped(),
      csrfToken: req.csrfToken()
    })
  }
  
  const data = matchedData(req)
  console.log('Sanitized: ', data)
  // Homework: send sanitized data in an email or persist in a db
  
  if (req.file) {
    console.log('Uploaded: ', req.file)
    // Homework: Upload file to S3
  }

  req.flash('success', 'Thanks for the message! I‘ll be in touch :)')
  res.redirect('/')

  let mailOpts, smtpTrans;
  smtpTrans = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'user@email.com', // get this into an environment variable!
      pass: 'password' // get this into an environment variable!
    }
  });
  mailOpts = {
    from: data.message + ' &lt;' + data.email + '&gt;',
    to: 'user@email.com',
    subject: 'New message from contact form at brandtprecision.com',
    text: `${req.body.email} - ${data.message}`,
    attachments: [ 
      { 
        filename: req.file.originalname, 
        content: req.file.buffer
      }
    ]
  };
  smtpTrans.sendMail(mailOpts, function (error, response) {
    if (error) {
      let selected_link = 'CONTACT';
      res.render('contact_failure', { selected_link });
    }
    else {
      let selected_link = 'CONTACT';
      res.render('contact_success', { selected_link });
    }
  });
})

module.exports = router
