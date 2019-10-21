const Router = require('express').Router;
const multer = require('multer');
const { asyncHandler } = require('../utils');

const UPLOAD_MAX_COUNT = 8;

const withUploadRouter = (...uploadFields) => {
  const upload = multer({ storage: multer.memoryStorage() });
  const router = Router();

  const fields = uploadFields.map(field => ({ name: field }));
  
  router
    .post('*', upload.fields(fields, UPLOAD_MAX_COUNT), asyncHandler(async (req, res, next) => {
      setFilesData(req);
      next();
    }))
    .put('*', upload.fields(fields, UPLOAD_MAX_COUNT), asyncHandler(async (req, res, next) => {
      setFilesData(req);
      next();
    }));

  return router;
};

const setFilesData = (req) => {
  if (!req.files) {
    return;
  }
  Object.entries(req.files).forEach(([fieldName, files]) => {
    req.body[fieldName] = [];
    files.forEach(file => {
      req.body[fieldName].push({
        data: file.buffer,
      });
    });
  });
};

module.exports = withUploadRouter;
