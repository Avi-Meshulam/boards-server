const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const imagesRouter = require('./routers/imagesRouter');
const router = require('./routers/router.service');
const withUploadRouter = require('./routers/withUploadRouter');
const MongooseDataService = require('./data/services/data.mongoose.service');

const app = express();

const boardsDataService = new MongooseDataService('board');
const postsDataService = new MongooseDataService('post');
const commentsDataService = new MongooseDataService('comment');

// middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// routes
app.use('/api/boards', withUploadRouter('image', 'imageData', boardsDataService));
app.use('/api/posts', withUploadRouter('image', 'imageData', postsDataService));
app.use('/api/comments', router(commentsDataService));
app.use('/images', imagesRouter(postsDataService));
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
