const asyncHandler = fn => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

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

module.exports = {
  asyncHandler,
  pathHierarchy,
  setUploadData,
};
