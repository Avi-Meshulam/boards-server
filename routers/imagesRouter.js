const express = require('express');
const DataService = require('../data/services/IDataService');

const imagesRouter = (dataService = new DataService()) => {
  const router = express.Router();
  return router
    .get('/:name', async (req, res, next) => {
      const imageData = await dataService.getImageData(req.params.name);
      if (!imageData) {
        next(); // 404 Not Found
      } else {
        res.send(new Buffer.from(imageData, 'binary'));
      }
    });
};

module.exports = imagesRouter;
