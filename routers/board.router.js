const Router = require('express').Router;
const { asyncHandler } = require('./router.utils');
const DataService = require('../data/services/IDataService');

const router = (dataService = new DataService()) => {
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
