const httpMethods = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

const httpErrors = {
  get badRequest() {
    let err = new Error('400 Bad Request');
    err.status = 400;
    return err;
  },
};

module.exports = {
  httpMethods,
  httpErrors,
};
