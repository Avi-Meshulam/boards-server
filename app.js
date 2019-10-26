const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const {
  connectDB,
  MongooseDataService,
} = require('./data/services/data.mongoose.service');
const router = require('./routers/router.service');

const DB_NAME = 'boards';

connectDB(DB_NAME);

const app = express();

// middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// key: upload field name
// value: storage field name
// no value applies storage and upload names are equals
const uploadMap = new Map();
uploadMap.set('images', 'image');
uploadMap.set('image');

// static routes
app.use(express.static(path.join(__dirname, 'public')));

// remove trailing slash from url
app.use((req, res, next) => {
  if (req.url[req.url.length - 1] === '/') {
    req.url = req.url.slice(0, -1);
  }
  next();
});

// routes
app.use('/api/boards', router(uploadMap, new MongooseDataService('board')));
app.use('/api/users', router(uploadMap, new MongooseDataService('user')));


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
