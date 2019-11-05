module.exports = {
  get badRequest() {
    let err = new Error('400 Bad Request');
    err.status = 400;
    return err;
  },

  alreadyExists(entityName) {
    let err = new Error(`${entityName} already exists`);
    err.status = 400;
    return err;
  },
};
