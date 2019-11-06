module.exports = {
  get badRequest() {
    let err = new Error('Bad Request');
    err.status = 400;
    return err;
  },

  alreadyExists(entityName) {
    let err = new Error(`${entityName} already exists`);
    err.status = 400;
    return err;
  },

  notFound(entityName) {
    let err = new Error(`${entityName} not found`);
    err.status = 404;
    return err;
  },
};
