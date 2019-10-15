const multer = require('multer');
const Router = require('express').Router;
const asyncHandler = require('../utils').asyncHandler;
const DataService = require('../data/services/IDataService');

const upload = multer();

const router = (dataService = new DataService()) => {

  const router = Router();

  router
    .all('*', asyncHandler(async (req, res, next) => {
      if (!dataService || !dataService.isReady) {
        res.sendStatus(503);  // Service Unavailable
      } else {
        next();
      }
    }))

    // GET
    .get('/', asyncHandler(async (req, res, next) => {
      // return dataService.get(req.query, req.body);
      const result = await dataService.get(req.query, req.body);
      res.json(result);
    }))

    // GET /:id
    .get('/:id', asyncHandler(async (req, res, next) => {
      const result = await dataService.getById(req.params.id, req.body);
      res.json(result);
    }))

    // POST
    .post('/', upload.none(), asyncHandler(async (req, res, next) => {
      const result = await dataService.insert(req.body);
      res.json(result);
    }))

    // PUT
    .put('/', upload.none(), asyncHandler(async (req, res, next) => {
      const result = await dataService.update(req.query, req.body);
      res.json(result);
    }))

    // PUT /:id
    .put('/:id', upload.none(), asyncHandler(async (req, res, next) => {
      const result = await dataService.updateById(req.params.id, req.body);
      res.json(result);
    }))

    // DELETE
    .delete('/', asyncHandler(async (req, res, next) => {
      const result = await dataService.remove(req.query);
      res.json(result);
    }))

    // DELETE /:id
    .delete('/:id', asyncHandler(async (req, res, next) => {
      const result = await dataService.removeById(req.params.id);
      res.json(result);
    }));

  return router;
};

module.exports = router;
