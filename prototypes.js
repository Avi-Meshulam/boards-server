Array.prototype.removeIf = function(predicate) {
  let deletedCount = 0;
  let index = this.length;
  while (index--) {
    if (predicate(this[index], index)) {
      this.splice(index, 1);
      deletedCount++;
    }
  }
  return { deletedCount };
};

Array.prototype.updateIf = function(
  predicate,
  data,
  compare = (x, y) => x === y,
) {
  let nFound = 0;
  let nModified = 0;
  let index = this.length;
  while (index--) {
    if (predicate(this[index], index)) {
      nFound++;
      if (!compare(this[index], data)) {
        this[index] = data;
        nModified++;
      }
    }
  }
  return {
    n: nFound,
    nModified,
  };
};
