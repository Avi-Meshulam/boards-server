// Empty data service (used mainly for strong typing)
module.exports = class IDataService {
  isReady() { return false; }
  async get(filter = {}, options = undefined) { return []; }
  async getById(id) { return {}; }
  async insert(data) { return []; }
  async update(filter, data) { return []; }
  async updateById(id, data) { return {}; }
  async remove(filter) { return false; }
  async removeById(id) { return false; }
};
