const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
// const multer = require('multer');
const {
  asyncHandler,
  // pathHierarchy,
  // setUploadData,
} = require('./router.utils');
const Router = require('express').Router;
const { check, validationResult } = require('express-validator');
const keys = require('../config/keys');
const DataService = require('../data/services/IDataService');
const httpErrors = require('../httpErrors');

// const UPLOAD_MAX_COUNT = 8;
// const upload = multer({ storage: multer.memoryStorage() });

const router = (uploadMap = new Map(), dataService = new DataService()) => {
  // const uploadFields = [...uploadMap.keys()].map(key => ({ name: key }));

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
          // return res.status(400).json({ errors: errors.array() });
          throw httpErrors.badRequest;
        }

        // const result = await dataService.get({ email }, { limit: 1 });
        const user = await dataService.getById(req.body.email);
        if (user) {
          throw httpErrors.alreadyExists('User');
        }

        // Get user gravatar
        const avatar = gravatar.url(req.body.email, {
          s: '200',
          r: 'pg',
          d: 'mm',
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.password, salt);

        const result = await dataService.insert({ ...req.body, password, avatar });

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
