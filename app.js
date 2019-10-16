const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const router = require('./routers/router.service');
const withUploadRouter = require('./routers/withUploadRouter');
const MongooseDataService = require('./data/services/data.mongoose.service');

const app = express();

// middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// routes
app.use('/api/boards', withUploadRouter('image', 'imageData', new MongooseDataService('board')));
app.use('/api/posts', withUploadRouter('image', 'imageData', new MongooseDataService('post')));
app.use('/api/users', withUploadRouter('image', 'imageData', new MongooseDataService('user')));
app.use('/api/comments', router(new MongooseDataService('comment')));

// static routes
app.use(express.static(path.join(__dirname, 'public')));

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
      message: err.message
    }
  });
});

module.exports = app;
