const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const Router = require('express').Router();
const { asyncHandler } = require('./router.utils');
const keys = require('../config/keys');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const DataService = require('../data/services/IDataService');

const router = (dataService = new DataService()) => {
  const router = Router();

  router
    // @route   GET api/auth/login
    // @desc    Auth
    // @access  Public
    .get(
      '/login',
      auth,
      asyncHandler(async (req, res, next) => {
        const user = await dataService.getById(req.user.id);
        res.json(user);
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
          res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // const result = await dataService.get({ email }, { limit: 1 });
        const user = await dataService.getById(email);
        if (!user) {
          res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
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

  return router;
};

module.exports = router;
