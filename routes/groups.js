const express = require('express');
const Group = require('../models').Group;

const router = express.Router();

/**
 * @api {get} /groups List groups
 * @apiName GetGroups
 * @apiGroup Group
 *
 * @apiSuccess {Object[]} body List of groups.
 * @apiSuccess {Number} body.id ID of the group.
 * @apiSuccess {String} body.name Name of the group.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/', (req, res) => (
  Group.findAll().then(groups => res.json(groups))
));

/**
 * @api {get} /groups Get a single group
 * @apiName GetGroup
 * @apiGroup Group
 *
 * @apiSuccess {Number} id ID of the group.
 * @apiSuccess {String} name Name of the group.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.get('/:id', (req, res) => (
  Group.find({ where: { id: req.params.id } }).then(group => res.json(group))
));

/**
 * @api {post} /groups Create a group
 * @apiName PostGroup
 * @apiGroup Group
 *
 * @apiParam {String} name Name of the group.
 *
 * @apiSuccess {Number} id ID of the group.
 * @apiSuccess {String} name Name of the group.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.post('/', (req, res) => (
  Group.create({ name: req.body.name }).then(group => res.json(group))
));

/**
 * @api {patch} /groups/:id Edit a group
 * @apiName PatchGroup
 * @apiGroup Group
 *
 * @apiParam {String} name Name of the group.
 *
 * @apiSuccess {Number} id ID of the group.
 * @apiSuccess {String} name Name of the group.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.patch('/:id', (req, res) => (
  Group.find({ where: { id: req.params.id } })
    .then(group => group.update(req.body))
    .then(group => res.json(group))
));

/**
 * @api {delete} /groups/:id Delete a group
 * @apiName DeleteGroup
 * @apiGroup Group
 */
router.delete('/:id', (req, res) => (
  Group.find({ where: { id: req.params.id } })
    .then(group => group.destroy())
    .then(() => res.sendStatus(204))
));

/**
 * @api {get} /groups/:id/members List members of a group
 * @apiName GetGroupMembers
 * @apiGroup Group
 *
 * @apiSuccess {Object[]} body List of members of a group.
 * @apiSuccess {Number} body.id ID of the user.
 * @apiSuccess {String} body.name Name of the user.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/:id/members', (req, res) => (
  Group.find({ where: { id: req.params.id } })
    .then(group => group.getUsers())
    .then(members => res.json(members.map(member => ({
      id: member.id,
      name: member.name,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }))))
));

/**
 * @api {post} /groups/:id/members Add a member to a group
 * @apiName PostGroupMember
 * @apiGroup Group
 *
 * @apiParam {Number} id ID of the user.
 */
router.post('/:id/members', (req, res) => (
  Group.find({ where: { id: req.params.id } })
    .then(group => group.addUser(req.body.userId))
    .then(() => res.sendStatus(204))
));

/**
 * @api {delete} /groups/:group-id/members/:user-id Remove a member from a group
 * @apiName DeleteGroupMember
 * @apiGroup Group
 */
router.delete('/:groupId/members/:userId', (req, res) => (
  Group.find({ where: { id: req.params.groupId } })
    .then(group => group.removeUser(req.params.userId))
    .then(() => res.sendStatus(204))
));

/**
 * @api {get} /groups/:id/exercises List exercises of a group
 * @apiName GetGroupExercises
 * @apiGroup Group
 *
 * @apiSuccess {Object[]} body List of exercises of a group.
 * @apiSuccess {Number} body.id ID of the exercise.
 * @apiSuccess {String} body.note Note of the exercise.
 * @apiSuccess {Object} body.user User of the exercise.
 * @apiSuccess {Object} body.sets Sets of the exercise.
 * @apiSuccess {Object} body.exerciseType Type of the exercise.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/:id/exercises', (req, res) => {
  const exercises = [];
  let exerciseTypes;
  let users;
  let sets;

  Group.find({ where: { id: req.params.id } })
    .then(group => group.getUsers())
    .then((usersOfGroup) => {
      users = usersOfGroup;
      if (users.length === 0) {
        res.json([]);
      }

      return Promise.all(users.map(user => user.getExercises()));
    })
    .then((exercisesOfUsers) => {
      exercisesOfUsers.forEach((exercisesOfUser, userIndex) => {
        exercisesOfUser.forEach((exercise) => {
          const exerciseExtendedWithUser = exercise;
          exerciseExtendedWithUser.user = users[userIndex];
          exercises.push(exerciseExtendedWithUser);
        });
      });

      return Promise.all(exercises.map(exercise => exercise.getSets()));
    })
    .then((setsOfExercises) => {
      sets = setsOfExercises;
      return Promise.all(exercises.map(exercise => exercise.getExerciseType()));
    })
    .then((typesOfExercises) => {
      exerciseTypes = typesOfExercises;
      return Promise.all(exercises.map((exercise, index) => ({
        id: exercise.id,
        note: exercise.note,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        user: exercise.user,
        sets: sets[index],
        exerciseType: exerciseTypes[index],
      })));
    })
    .then(result => res.json(result));
});

module.exports = router;
