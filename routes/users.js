const express = require('express');
const Joi = require('joi');
const NotFoundError = require('../errors/not-found-error');
const InvalidRequestBodyError = require('../errors/invalid-request-body-error');
const User = require('../models').User;

const router = express.Router();

/**
 * @api {get} /users/:id Get a single user
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiSuccess {Number} id ID of user.
 * @apiSuccess {String} name Name of the user.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.get('/:id', (req, res, next) => (
  User.find({ where: { id: req.params.id } })
    .then((user) => {
      if (user) {
        res.json(user);
      } else {
        next(new NotFoundError('User not found'));
      }
    })
));

/**
 * @api {post} /users Create an user
 * @apiName PostUser
 * @apiGroup User
 *
 * @apiParam {String} name Name of the user.
 *
 * @apiSuccess {Number} id ID of user.
 * @apiSuccess {String} name Name of the user.
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
    User.create({ name: req.body.name }).then(user => res.json(user));
  }
});

/**
 * @api {patch} /users/:id Edit an user
 * @apiName PatchUser
 * @apiGroup User
 *
 * @apiParam {String} name Name of the user.
 *
 * @apiSuccess {Number} id ID of the exercise type.
 * @apiSuccess {String} name Name of the exercise.
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
    User.find({ where: { id: req.params.id } })
      .then((user) => {
        if (!user) {
          next(new NotFoundError('User not found'));
        }

        return user.update(req.body);
      })
      .then(user => res.json(user))
      .catch(next);
  }
});

/**
 * @api {delete} /users/:id Delete an user
 * @apiName DeleteUser
 * @apiGroup User
 */
router.delete('/:id', (req, res, next) => (
  User.find({ where: { id: req.params.id } })
    .then((user) => {
      if (!user) {
        next(new NotFoundError('User not found'));
      }

      return user.destroy();
    })
    .then(() => res.sendStatus(204))
    .catch(next)
));

/**
 * @api {get} /users/:id/groups List groups of user
 * @apiName GetUserGroups
 * @apiGroup User
 *
 * @apiSuccess {Object[]} body List of groups of user.
 * @apiSuccess {Number} body.id ID of user.
 * @apiSuccess {String} body.name Name of the user.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/:id/groups', (req, res, next) => (
  User.find({ where: { id: req.params.id } })
    .then((user) => {
      if (!user) {
        next(new NotFoundError('User not found'));
      }

      return user.getGroups();
    })
    .then(groups => res.json(groups.map(group => ({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }))))
    .catch(next)
));

/**
 * @api {get} /users/:id/exercises List exercises of user
 * @apiName GetUserExercises
 * @apiGroup User
 *
 * @apiSuccess {Object[]} body List of exercises of user.
 * @apiSuccess {Number} body.id ID of exercise.
 * @apiSuccess {String} body.note Note of exercise.
 * @apiSuccess {Object} body.sets Sets of exercise.
 * @apiSuccess {Object} body.user User of exercise.
 * @apiSuccess {Object} body.exerciseType Type of exercise.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/:id/exercises', (req, res, next) => {
  let user;
  let exercises;
  let sets;

  User.find({ where: { id: req.params.id } })
    .then((foundUser) => {
      if (!foundUser) {
        next(new NotFoundError('User not found'));
      }

      user = foundUser;
      return user.getExercises();
    })
    .then((exercisesOfUser) => {
      exercises = exercisesOfUser;
      // get sets of each exercise
      return Promise.all(exercises.map(exercise => exercise.getSets()));
    })
    .then((setsOfExercises) => {
      sets = setsOfExercises;
      // get types of each exercise
      return Promise.all(exercises.map(exercise => exercise.getExerciseType()));
    })
    .then(exerciseTypes => Promise.all(exercises.map((exercise, index) => ({
      user,
      id: exercise.id,
      note: exercise.note,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
      sets: sets[index],
      exerciseType: exerciseTypes[index],
    }))))
    .then(result => res.json(result))
    .catch(next);
});

module.exports = router;
