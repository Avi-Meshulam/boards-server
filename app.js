const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const passport = require('passport');
const { connectDB } = require('./data/services/dbUtils');
const MongooseDataService = require('./data/services/data.mongoose.service');
const authRouter = require('./routers/auth.router');
const router = require('./routers/router.service');
const userRouter = require('./routers/user.router');
const boardRouter = require('./routers/board.router');

require('./services/passport-setup');
require('./prototypes');

const DB_NAME = 'boards';

connectDB(DB_NAME);

const app = express();

app.use(passport.initialize());

// middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// KEY:   Upload field name
// VALUE: Storage field name (no value means
//        storage and upload names are the same)
const uploadMap = new Map();
uploadMap.set('images', 'image');
uploadMap.set('image', 'image');

// static routes
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));

// remove trailing slash from url
app.use((req, res, next) => {
  if (req.url[req.url.length - 1] === '/') {
    req.url = req.url.slice(0, -1);
  }
  next();
});

// data services
const boardDataService = new MongooseDataService('board');
const userDataService = new MongooseDataService('user');

// routes
app.use('/api/auth', authRouter);
app.use(
  '/api/boards',
  boardRouter(uploadMap, boardDataService),
  router(uploadMap, boardDataService),
);
app.use('/api/users', [
  userRouter(uploadMap, userDataService),
  router(uploadMap, userDataService),
]);

app.use((req, res, next) => {
  let err = new Error('404 Not Found');
  err.status = 404;
  next(err);
});

// uncaught error handling
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
    },
  });
});

module.exports = app;
