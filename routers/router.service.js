const multer = require('multer');
const Router = require('express').Router;
const DataService = require('../data/services/IDataService');
const asyncHandler = require('../utils').asyncHandler;

const UPLOAD_MAX_COUNT = 8;
const upload = multer({ storage: multer.memoryStorage() });

const router = (uploadMap = new Map(), dataService = new DataService()) => {
  const uploadFields = [...uploadMap.keys()].map(key => ({ name: key }));

  // no value means storage and upload names are the same
  uploadMap.forEach((value, key) => {
    if (!value) {
      uploadMap.set(key, key);
    }
  });

  const router = Router();

  router
    // ALL *
    .all(
      '*',
      asyncHandler(async (req, res, next) => {
        if (!dataService || !dataService.isReady) {
          res.sendStatus(503); // Service Unavailable
        } else {
          next();
        }
      }),
    )

    // GET
    .get(
      '/',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.get(req.query, req.header.options);
        res.json(result);
      }),
    )

    // GET /:id
    .get(
      '/:id',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.getById(req.params.id);
        res.json(result);
      }),
    )

    // GET /:id/*
    .get(
      '/:id/*',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.getSubDocument(
          req.params.id,
          pathHierarchy(req.path),
          req.query,
          req.headers.options,
        );
        if ([...uploadMap.values()].includes(req.params[0].split('/').pop())) {
          res.send(new Buffer.from(result, 'binary'));
        } else {
          res.json(result);
        }
      }),
    )

    // POST *
    .post(
      '*',
      upload.fields(uploadFields, UPLOAD_MAX_COUNT),
      asyncHandler(async (req, res, next) => {
        setUploadData(req, uploadMap);
        next();
      }),
    )

    // POST
    .post(
      '/',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.insert(req.body, req.headers.options);
        res.json(result);
      }),
    )

    // POST/:id/*
    .post(
      '/:id/*',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.insertSubDocument(
          req.params.id,
          pathHierarchy(req.path),
          req.body,
        );
        res.json(result);
      }),
    )

    // PUT *
    .put(
      '*',
      upload.fields(uploadFields, UPLOAD_MAX_COUNT),
      asyncHandler(async (req, res, next) => {
        setUploadData(req, uploadMap);
        next();
      }),
    )

    // PUT
    .put(
      '/',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.update(req.query, req.body);
        res.json(result);
      }),
    )

    // PUT /:id
    .put(
      '/:id',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.updateById(req.params.id, req.body);
        res.json(result);
      }),
    )

    // PUT /:id/*
    .put(
      '/:id/*',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.updateSubDocument(
          req.params.id,
          pathHierarchy(req.path),
          req.query,
          req.body,
        );
        res.json(result);
      }),
    )

    // DELETE
    .delete(
      '/',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.remove(req.query);
        res.json(result);
      }),
    )

    // DELETE /:id
    .delete(
      '/:id',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.removeById(req.params.id);
        res.json(result);
      }),
    )

    // DELETE /:id/*
    .delete(
      '/:id/*',
      asyncHandler(async (req, res, next) => {
        const result = await dataService.removeSubDocument(
          req.params.id,
          pathHierarchy(req.path),
          req.query,
          req.body,
        );
        res.json(result);
      }),
    );

  return router;
};

// *** helper functions *** //

const pathHierarchy = path =>
  path
    .substr(1)
    .split('/')
    .slice(1);

const setUploadData = (req, uploadMap) => {
  if (!req.files) {
    return;
  }
  Object.entries(req.files).forEach(([uploadName, files]) => {
    // no value means storage and upload names are the same
    const storageName = uploadMap.get(uploadName) || uploadName;
    if (storageName !== uploadName) {
      // uploadName represents an array
      req.body[uploadName] = [];
      files.forEach(file => {
        req.body[uploadName].push({ [storageName]: file.buffer });
      });
    } else {
      // in case of multiple files - take only the last one
      req.body[uploadName] = files[files.length - 1].buffer;
    }
  });
};

module.exports = router;
