const multer = require('multer');
const Router = require('express').Router;
const DataService = require('../data/services/IDataService');
const asyncHandler = require('../utils').asyncHandler;
const httpErrors = require('../httpErrors');

const UPLOAD_MAX_COUNT = 8;
const upload = multer({ storage: multer.memoryStorage() });

const router = (uploadMap = new Map(), dataService = new DataService()) => {
  const uploadFields = [...uploadMap.keys()].map(key => ({ name: key }));
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

    // ALL /:id/*
    .all('/:id/*', (req, res, next) => {
      setSubDocumentInfo(req);
      next();
    })

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
        const result = await dataService.getSubDocument(req.subDocumentInfo);
        res.json(result);
      }),
    )

    // POST *
    .post(
      '*',
      upload.fields(uploadFields, UPLOAD_MAX_COUNT),
      asyncHandler(async (req, res, next) => {
        setFilesData(req, uploadMap);
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
        const path = req.subDocumentInfo.path;
        if (path[path.length - 1].id) {
          next(httpErrors.badRequest);
        }
        const result = await dataService.insertSubDocument(req.subDocumentInfo, req.body);
        res.json(result);
      }),
    )

    // PUT *
    .put(
      '*',
      upload.fields(uploadFields, UPLOAD_MAX_COUNT),
      asyncHandler(async (req, res, next) => {
        setFilesData(req, uploadMap);
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
        const result = await dataService.updateSubDocument(req.subDocumentInfo, req.body);
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
        const result = await dataService.removeSubDocument(req.subDocumentInfo);
        res.json(result);
      }),
    );

  return router;
};

// *** helper functions *** //

const setFilesData = (req, uploadMap) => {
  if (!req.files) {
    return;
  }
  Object.entries(req.files).forEach(([uploadName, files]) => {
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

const setSubDocumentInfo = req => {
  const urlPath = req.path.substr(1).split('/');
  const path = [];
  for (let index = 1; index < urlPath.length; index++) {
    if (index % 2 === 0) {
      path.push({ id: urlPath[index] });
    } else {
      path.push(urlPath[index]);
    }
  }
  req.url = `/${req.params.id}/${urlPath[1]}`;
  req.subDocumentInfo = {
    ownerId: req.params.id,
    path,
    filter: req.query,
    options: req.headers.options && JSON.parse(req.headers.options),
  };
};

module.exports = router;
