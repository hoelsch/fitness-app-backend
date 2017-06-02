const Mock = require('./mock');
const ExerciseType = require('../../models').ExerciseType;
const Exercise = require('../../models').Exercise;
const User = require('../../models').User;
const Set = require('../../models').Set;
const Comment = require('../../models').Comment;
const Group = require('../../models').Group;

// Mock data for our tests
const exerciseType = { name: 'ExerciseType' };
const set = { numReps: 10, weight: 100 };
const user = { name: 'User' };
const comment = { text: 'Comment' };
const group = { name: 'Group' };
const exercise = { note: 'Note' };

const ExerciseTypeMock = new Mock({
  getMockData: () => exerciseType,
  createPersistentInstance: () => ExerciseType.create(exerciseType),
  findPersistentInstanceById: name => ExerciseType.findById(name),
  deletePersistentInstances: () => ExerciseType.destroy({ where: {} }),
});

const ExerciseMock = new Mock({
  getMockData: () => exercise,
  createPersistentInstance: () => new Promise((resolve, reject) => {
    let persistentExercise;
    let persistentExerciseType;
    let persistentSet;
    let persistentUser;
    let persistentComment;

    Promise.all([
      Exercise.create(exercise),
      ExerciseType.create(exerciseType),
      Set.create(set),
      User.create(Object.assign({}, user, {
        totalWeightLifted: set.numReps * set.weight,
      })),
      Comment.create(comment),
    ])
      .then((values) => {
        persistentExercise = values[0];
        persistentExerciseType = values[1];
        persistentSet = values[2];
        persistentUser = values[3];
        persistentComment = values[4];

        return persistentExercise.setExerciseType(persistentExerciseType);
      })
      .then(() => persistentSet.setExercise(persistentExercise))
      .then(() => persistentExercise.setUser(persistentUser))
      .then(() => persistentComment.setUser(persistentUser))
      .then(() => persistentComment.setExercise(persistentExercise))
      .then(() => {
        resolve({
          exercise: persistentExercise,
          exerciseType: persistentExerciseType,
          set: persistentSet,
          user: persistentUser,
          comment: persistentComment,
        });
      })
      .catch(reject);
  }),
  findPersistentInstanceById: id => Exercise.findById(id),
  deletePersistentInstances: () =>
    Exercise.destroy({ where: {} })
      .then(() => ExerciseType.destroy({ where: {} }))
      .then(() => Set.destroy({ where: {} }))
      .then(() => User.destroy({ where: {} }))
      .then(() => Comment.destroy({ where: {} })),
});

const UserMock = new Mock({
  getMockData: () => user,
  createPersistentInstance: () => new Promise((resolve, reject) => {
    let persistentUser;
    let persistentGroup;
    let persistentExercise;
    let persistentExerciseType;
    let persistentSet;

    Promise.all([
      User.create(user),
      Group.create(group),
      Exercise.create(exercise),
      ExerciseType.create(exerciseType),
      Set.create(set),
    ])
      .then((values) => {
        persistentUser = values[0];
        persistentGroup = values[1];
        persistentExercise = values[2];
        persistentExerciseType = values[3];
        persistentSet = values[4];

        return persistentExercise.setUser(persistentUser);
      })
      .then(() => persistentGroup.addUser(persistentUser))
      .then(() => persistentExercise.setExerciseType(persistentExerciseType))
      .then(() => persistentSet.setExercise(persistentExercise))
      .then(() => resolve({
        user: persistentUser,
        group: persistentGroup,
        exercise: persistentExercise,
        exerciseType: persistentExerciseType,
        sets: persistentSet,
      }))
      .catch(reject);
  }),
  findPersistentInstanceById: id => User.findById(id),
  deletePersistentInstances: () =>
    User.destroy({ where: {} })
      .then(() => Group.destroy({ where: {} }))
      .then(() => Exercise.destroy({ where: {} }))
      .then(() => ExerciseType.destroy({ where: {} }))
      .then(() => Set.destroy({ where: {} })),
});

const GroupMock = new Mock({
  getMockData: () => group,
  createPersistentInstance: () => new Promise((resolve) => {
    let persistentGroup;
    let persistentUser;
    let persistentSet;
    let persistentExercise;
    let persistentExerciseType;

    Promise.all([
      Group.create(group),
      User.create(user),
      Exercise.create(exercise),
      ExerciseType.create(exerciseType),
      Set.create(set),
    ])
      .then((values) => {
        persistentGroup = values[0];
        persistentUser = values[1];
        persistentExercise = values[2];
        persistentExerciseType = values[3];
        persistentSet = values[4];

        return persistentGroup.addUser(persistentUser);
      })
      .then(() => persistentExercise.setUser(persistentUser))
      .then(() => persistentExercise.setExerciseType(persistentExerciseType))
      .then(() => persistentSet.setExercise(persistentExercise))
      .then(() => resolve({
        group: persistentGroup,
        user: persistentUser,
        exercise: persistentExercise,
        exerciseType: persistentExerciseType,
        sets: [persistentSet],
      }));
  }),
  findPersistentInstanceById: id => Group.findById(id),
  deletePersistentInstances: () =>
    Group.destroy({ where: {} })
      .then(() => User.destroy({ where: {} }))
      .then(() => Exercise.destroy({ where: {} }))
      .then(() => ExerciseType.destroy({ where: {} }))
      .then(() => Set.destroy({ where: {} })),
});

module.exports = {
  ExerciseTypeMock,
  ExerciseMock,
  UserMock,
  GroupMock,
  set,
};
