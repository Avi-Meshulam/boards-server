const Router = require('express').Router;
// const multer = require('multer');
const {
  asyncHandler,
  // pathHierarchy,
  // setUploadData,
} = require('./router.utils');
const DataService = require('../data/services/IDataService');
// const httpErrors = require('../httpErrors');

// const UPLOAD_MAX_COUNT = 8;
// const upload = multer({ storage: multer.memoryStorage() });

const router = (uploadMap = new Map(), dataService = new DataService()) => {
  // const uploadFields = [...uploadMap.keys()].map(key => ({ name: key }));

  const router = Router();

  router
    // @route   GET api/boards
    // @desc    Get boards by location
    // @access  Public
    .get(
      '/:latLng',
      asyncHandler(async (req, res, next) => {
        let lat;
        let lng;
        try {
          const latLng = JSON.parse(req.params.latLng);
          lat = latLng.lat;
          lng = latLng.lng;
        } catch (error) {
          return next();
        }

        const boards = await dataService.get({
          geoLocation: {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: 1500,
            },
          },
        });

        res.json(boards);
      }),
    );

  return router;
};

module.exports = router;
