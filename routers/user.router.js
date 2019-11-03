const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils').asyncHandler;
const keys = require('../config/keys');
const { check, validationResult } = require('express-validator');
const User = require('../data/models/user.model');

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
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      try {
        // See if user exists
        let user = await User.findOne({ email });

        if (user) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'User already exists' }] });
        }

        // Get user gravatar
        const avatar = gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm',
        });

        user = new User({
          name,
          email,
          avatar,
          password,
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

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

        //res.send('User registered');
      } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
      }
    }),
  );

// @route   DELETE api/users
// @desc    DELETE user
// @access  Private
// router.delete(
//   '/',
//   auth,
//   asyncHandler(async (req, res, next) => {
//     try {
//       // Remove user
//       await User.findOneAndRemove({ _id: req.user.id });
//       res.send('User deleted');
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send('Server error');
//     }
//   }),
// );

module.exports = router;
