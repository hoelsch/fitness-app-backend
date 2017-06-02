/** Class representing mock data for our tests. */
class Mock {
 /**
  * Create a mock data instance
  * @param {function} getMockData - Return the mock data
  * @param {function} createPersistentInstance - Creates and returns a persistent instance
  * @param {function} findPersistentInstanceById - Finds a persistent instance
  * @param {function} deletePersistentInstance - Deletes all persistent instances
  */
  constructor({
    getMockData,
    createPersistentInstance,
    findPersistentInstanceById,
    deletePersistentInstances,
  }) {
    this.getMockData = getMockData;
    this.createPersistentInstance = createPersistentInstance;
    this.findPersistentInstanceById = findPersistentInstanceById;
    this.deletePersistentInstances = deletePersistentInstances;
  }
}

module.exports = Mock;
