const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('./router.utils');
const keys = require('../config/keys');
const User = require('../data/models/user.model');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

router
  // @route   GET api/auth/login
  // @desc    Auth
  // @access  Public
  .get(
    '/login',
    auth,
    asyncHandler(async (req, res, next) => {
      try {
        const user = await User.findById(req.user.id).select('-password');
        // res.json(user);
        res.send(user);
      } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
      }
    }),
  )

  // @route   POST api/auth/user-login
  // @desc    Authenticate user && get token
  // @access  Public
  .post(
    '/user-login',
    [
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Password is required').exists(),
    ],
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      try {
        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        // Return jsonwebtoken
        const payload = {
          user: {
            id: user.id,
          },
        };

        jwt.sign(
          payload,
          keys.jwt.secret,
          { expiresIn: 360000 },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          },
        );
      } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
      }
    }),
  )

  // auth with google
  // @route   GET api/auth/google
  // @desc    Authenticate user with google && get token from callback route to google
  // @access  Public
  .get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }),
  )

  // callback route for google to redirect to app
  .get(
    '/google/redirect',
    passport.authenticate('google', { session: false }),
    asyncHandler(async (req, res, next) => {
      // Return jsonwebtoken
      const payload = {
        user: {
          id: req.user.id,
        },
      };

      jwt.sign(
        payload,
        keys.jwt.secret,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.redirect(`http://localhost:3000/redirect/${token}`);
        },
      );
    }),
  );

module.exports = router;
