const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const Router = require('express').Router;
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('./router.utils');
const keys = require('../config/keys');
const DataService = require('../data/services/IDataService');
const httpErrors = require('../httpErrors');

const router = (dataService = new DataService()) => {
  const router = Router();

  router
    // @route   POST api/users
    // @desc    Register user
    // @access  Private
    .post(
      '/register',
      [
        check('name', 'Name is required')
          .not()
          .isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
          'password',
          'Please insert password with 6 or more characters..',
        ).isLength({ min: 6 }),
      ],
      asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // const result = await dataService.get({ email }, { limit: 1 });
        const user = await dataService.getById(email);
        if (user) {
          next(httpErrors.alreadyExists('User'));
        }

        // Get user gravatar
        const avatar = gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm',
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        const encoded = await bcrypt.hash(password, salt);

        const result = await dataService.insert({
          ...req.body,
          password: encoded,
          avatar,
        });

        // Return jsonwebtoken
        const payload = {
          user: {
            id: result.id,
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
    );

  return router;
};

module.exports = router;
