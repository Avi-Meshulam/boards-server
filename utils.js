const asyncHandler = fn => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// converts a function with a callback param to a function
// that returns a promise. In case input param is an object -
// promisify all its functions.
const promisify = param => {
  const promisifyFunc = func => (...params) =>
    new Promise((resolve, reject) => {
      func(...params, (err, data) => (err ? reject(err) : resolve(data || true)));
    });

  const promisifyObj = obj =>
    Object.keys(obj)
      .filter(key => typeof obj[key] === 'function')
      .reduce((acc, cur) => ({ ...acc, [cur]: promisifyFunc(obj[cur]) }), {});
  switch (typeof param) {
    case 'function':
      return promisifyFunc(param);
    case 'object':
      return promisifyObj(param);
    default:
      break;
  }
};

function sortArray(arr, field, isReverse = false) {
  if (isNaN(arr[0][field])) {
    return sortIgnoreCase(arr, field, isReverse);
  } else {
    return sortNumbers(arr, field, isReverse);
  }
}

function sortIgnoreCase(arr, field, isReverse = false) {
  if (isReverse) {
    if (field) {
      return arr.sort((a, b) => caseInsensitiveSort(b[field], a[field]));
    } else {
      return arr.sort((a, b) => caseInsensitiveSort(b, a));
    }
  } else {
    if (field) {
      return arr.sort((a, b) => caseInsensitiveSort(a[field], b[field]));
    } else {
      return arr.sort((a, b) => caseInsensitiveSort(a, b));
    }
  }
}

function sortNumbers(arr, field, isReverse = false) {
  if (isReverse) {
    if (field) {
      return arr.sort((a, b) => b[field] - a[field]);
    } else {
      return arr.sort((a, b) => b - a);
    }
  } else {
    if (field) {
      return arr.sort((a, b) => a[field] - b[field]);
    } else {
      return arr.sort((a, b) => a - b);
    }
  }
}

function removeTimestamp(obj) {
  const { createdAt, updatedAt, ...result } = obj;
  return result;
}

function isEqual(obj1, obj2) {
  return JSON.stringify(removeTimestamp(obj1)) === JSON.stringify(removeTimestamp(obj2));
}

function tryParseJSON(input) {
  let result;
  try {
    result = JSON.parse(input);
  } catch (error) {
    return input;
  }
  return result;
}

// helper functions

const caseInsensitiveSort = (a, b) => b.toString().localeCompare(a.toString(), undefined, { sensitivity: 'base' });

module.exports = {
  asyncHandler,
  promisify,
  sortArray,
  removeTimestamp,
  isEqual,
  tryParseJSON,
};
