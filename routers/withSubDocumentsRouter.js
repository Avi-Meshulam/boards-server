const Router = require('express').Router;

const withSubDocumentsRouter = subDocuments => {
  const router = Router();

  router
    // ALL /:id/*
    .all('/:id/*', (req, res, next) => {
      const urlPath = req.path.substr(1).split('/');
      const subDocument = urlPath[1];
      if (!subDocuments.includes(subDocument)) {
        let err = new Error('404 Not Found');
        err.status = 404;
        next(err);
      }
      const path = [];
      for (let index = 1; index < urlPath.length; index++) {
        if (subDocuments.includes(urlPath[index])) {
          path.push(urlPath[index]);
        } else {
          path.push({ id: urlPath[index] });
        }
      }
      req.url = `/${req.params.id}/${subDocument}`;
      req.subDocumentInfo = {
        ownerId: req.params.id,
        path,
        filter: req.query,
        options: req.headers.options,
      };
      next();
    });

  return router;
};

module.exports = withSubDocumentsRouter;
