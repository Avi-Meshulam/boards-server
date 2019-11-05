// converts a function with a callback param to a function
// that returns a promise. In case input param is an object -
// promisify all its functions.
const promisify = param => {
  const promisifyFunc = func => (...params) =>
    new Promise((resolve, reject) => {
      func(...params, (err, data) =>
        err ? reject(err) : resolve(data || true),
      );
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

function getDuplicates(arr) {
  return arr.reduce(function(acc, el, i, arr) {
    if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) {
      acc.push(el);
    }
    return acc;
  }, []);
}

// helper functions

const caseInsensitiveSort = (a, b) =>
  b.toString().localeCompare(a.toString(), undefined, { sensitivity: 'base' });

module.exports = {
  promisify,
  sortArray,
  getDuplicates,
};
