const Router = require('express').Router;
const DataService = require('../data/services/IDataService');
const { generateFileName } = require('../utils');
const multer = require('multer');
const routerService = require('./router.service');
const { asyncHandler, filterObj } = require('../utils');

const withUploadRouter = (inputName, storageName, dataService = new DataService()) => {
  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  const router = Router();

  router
    .get('*', asyncHandler(async (req, res, next) => {
      req.body = { ...req.body, projection: { [storageName]: 0 }, sort: { _id: -1 } };
      next();
    }))
    .get('/images/:name', asyncHandler(async (req, res, next) => {
      const imageData = await dataService.getImageData(req.params.name);
      if (!imageData) {
        next(); // 404 Not Found
      } else {
        res.send(new Buffer.from(imageData, 'binary'));
      }
    }))
    .post('/', upload.single(inputName), asyncHandler(async (req, res, next) => {
      setFileData(req, inputName, storageName);
      const result = filterObj(await dataService.insert(req.body), [storageName]);
      res.json(result);
    }))
    .put('/', upload.single(inputName), asyncHandler(async (req, res, next) => {
      setFileData(req, inputName, storageName);
      const result = filterObj(await dataService.update(req.query, req.body), [storageName]);
      res.json(result);
    }))
    .put('/:id', upload.single(inputName), asyncHandler(async (req, res, next) => {
      setFileData(req, inputName, storageName);
      const result = filterObj(await dataService.updateById(req.params.id, req.body), [storageName]);
      res.json(result);
    }));

  router.use(routerService(dataService));

  return router;
};

const setFileData = (req, inputName, storageName) => {
  if (req.file) {
    req.body[inputName] = generateFileName(req.file);
    req.body[storageName] = req.file.buffer;
  }
};

module.exports = withUploadRouter;
