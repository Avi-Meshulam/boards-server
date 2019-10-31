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
  equals = (x, y) => x === y,
  project = (doc, data) => data,
) {
  let nFound = 0;
  let nModified = 0;
  let index = this.length;
  while (index--) {
    if (predicate(this[index], index)) {
      nFound++;
      if (!equals(this[index], data)) {
        this[index] = project(this[index], data);
        nModified++;
      }
    }
  }
  return {
    n: nFound,
    nModified,
  };
};
