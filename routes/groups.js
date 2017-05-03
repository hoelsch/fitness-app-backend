const express = require('express');
const Joi = require('joi');
const NotFoundError = require('../errors/not-found-error');
const InvalidRequestBodyError = require('../errors/invalid-request-body-error');
const Group = require('../models').Group;
const User = require('../models').User;
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;
const Set = require('../models').Set;

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
router.get('/', (req, res) => {
  Group.findAll().then(groups => res.json(groups));
});

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
router.get('/:id', (req, res, next) => {
  Group.findById(req.params.id)
    .then((group) => {
      if (!group) {
        next(new NotFoundError('Group not found'));
      } else {
        res.json(group);
      }
    });
});

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
router.post('/', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    name: Joi.string().required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    Group.create(req.body).then(group => res.json(group));
  }
});

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
router.patch('/:id', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    name: Joi.string().required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    Group.findById(req.params.id)
      .then((group) => {
        if (!group) {
          throw new NotFoundError('Group not found');
        }

        return group.update(req.body);
      })
      .then(group => res.json(group))
      .catch(next);
  }
});

/**
 * @api {delete} /groups/:id Delete a group
 * @apiName DeleteGroup
 * @apiGroup Group
 */
router.delete('/:id', (req, res, next) => (
  Group.destroy({ where: { id: req.params.id } })
    .then((numDeletedGroups) => {
      if (numDeletedGroups === 0) {
        throw new NotFoundError('Group not found');
      }

      res.sendStatus(204);
    })
    .catch(next)
));

/**
 * @api {get} /groups/:id/members List members of a group
 * @apiName GetGroupMembers
 * @apiGroup Group
 *
 * @apiSuccess {Object[]} body List of members of a group.
 * @apiSuccess {Number} body.id ID of the user.
 * @apiSuccess {String} body.name Name of the user.
 * @apiSuccess {Number} body.totalWeightLifted Total weight lifted by the user.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/:id/members', (req, res, next) => (
  Group.findAll({ where: { id: req.params.id }, include: [User] })
    .then((groups) => {
      const group = groups[0];
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      res.json(group.Users);
    })
    .catch(next)
));

/**
 * @api {post} /groups/:id/members Add a member to a group
 * @apiName PostGroupMember
 * @apiGroup Group
 *
 * @apiParam {Number} userId ID of the user.
 */
router.post('/:id/members', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    userId: Joi.number().required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    Group.findById(req.params.id)
      .then((group) => {
        if (!group) {
          throw new NotFoundError('Group not found');
        }

        return group.addUser(req.body.userId);
      })
      .then(() => res.sendStatus(204))
      .catch(next);
  }
});

/**
 * @api {delete} /groups/:group-id/members/:user-id Remove a member from a group
 * @apiName DeleteGroupMember
 * @apiGroup Group
 */
router.delete('/:groupId/members/:userId', (req, res, next) => {
  Promise.all([
    Group.findById(req.params.groupId),
    User.findById(req.params.userId),
  ])
    .then((result) => {
      const group = result[0];
      const user = result[1];

      if (!group) {
        throw new NotFoundError('Group not found');
      }
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return group.removeUser(req.params.userId);
    })
    .then(() => res.sendStatus(204))
    .catch(next);
});

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
router.get('/:id/exercises', (req, res, next) => {
  Group.findAll({
    where: { id: req.params.id },
    include: [{
      model: User,
      include: [{
        model: Exercise,
        include: [Set, ExerciseType, User],
      }],
    }],
  })
    .then((groups) => {
      const group = groups[0];
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // array in which each entry is another array containing the exercises of an user
      const exercisesOfUsers = group.Users.map(user => user.Exercises);
      // flatten exercisesOfUsers array --> result is an array with all exercises of the group
      const exercises = [].concat(...exercisesOfUsers);

      res.json(exercises.map(exercise => ({
        id: exercise.id,
        note: exercise.note,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        user: exercise.User,
        exerciseType: exercise.ExerciseType,
        sets: exercise.Sets,
      })));
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
