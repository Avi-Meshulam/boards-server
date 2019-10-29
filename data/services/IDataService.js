// Empty data service (used mainly for strong typing)
module.exports = class IDataService {
  isReady() { return false; }
  async get(filter, options) { return []; }
  async getById(id) { return {}; }
  async getSubDocument(ownerId, path, filter, options) { return {}; }
  async insert(data) { return []; }
  async insertSubDocument(ownerId, path, data) { return []; }
  async update(filter, data) { return []; }
  async updateById(id, data) { return {}; }
  async updateSubDocument(ownerId, path, filter, data) { return {}; }
  async remove(filter) { return false; }
  async removeById(id) { return false; }
  async removeSubDocument(ownerId, path, filter) { return false; }
};
