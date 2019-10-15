const asyncHandler = (fn) => (req, res, next) => {
  return Promise
    .resolve(fn(req, res, next))
    .catch(next);
};

// converts a function that takes a callback to a function 
// that returns a promise. In case input param is an object - 
// promisify all its functions.
const promisify = (param) => {
  const promisifyFunc = (func) => (...params) =>
    new Promise((resolve, reject) => {
      func(...params, (err, data) => err ? reject(err) : resolve(data || true));
    });

  const promisifyObj = (obj) => (
    Object.keys(obj)
      .filter(key => typeof obj[key] === 'function')
      .reduce((acc, cur) => ({ ...acc, [cur]: promisifyFunc(obj[cur]) }), {})
  );
  switch (typeof param) {
    case 'function':
      return promisifyFunc(param);
    case 'object':
      return promisifyObj(param);
    default:
      break;
  }
};

const generateFileName = (file) => {
  const name = file.originalname.split('.')[0];
  const ext = file.mimetype.split('/')[1];
  return `${name}_${hash()}.${ext}`;
};

function filterObj(obj, fieldsToRemove = []) {
  if (!fieldsToRemove || fieldsToRemove.length === 0) {
    return obj;
  }
  const result = {};
  Object.keys(obj).forEach(key => {
    if (!fieldsToRemove.includes(key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

// helper functions

const hash = () => Math.random().toString(36).substr(2) + (+new Date()).toString(36);

module.exports = {
  asyncHandler,
  filterObj,
  generateFileName,
  promisify,
};
