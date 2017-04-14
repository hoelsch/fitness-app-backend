const express = require('express');
const Joi = require('joi');
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
        const err = new Error('User not found');
        err.status = 404;
        next(err);
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
    const err = new Error('Invalid request body');
    err.status = 400;
    next(err);
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
    const err = new Error('Invalid request body');
    err.status = 400;
    next(err);
  } else {
    User.find({ where: { id: req.params.id } })
      .then((user) => {
        if (!user) {
          const err = new Error('User not found');
          err.status = 404;
          throw err;
        }

        return user.update(req.body);
      })
      .then(user => res.json(user))
      .catch(err => next(err));
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
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }

      return user.destroy();
    })
    .then(() => res.sendStatus(204))
    .catch(err => next(err))
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
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }

      return user.getGroups();
    })
    .then(groups => res.json(groups.map(group => ({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }))))
    .catch(err => next(err))
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
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }

      user = foundUser;
      return user.getExercises();
    })
    .then((exercisesOfUser) => {
      exercises = exercisesOfUser;
      return Promise.all(exercises.map(exercise => exercise.getSets()));
    })
    .then((setsOfExercises) => {
      sets = setsOfExercises;
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
    .catch(err => next(err));
});

module.exports = router;
