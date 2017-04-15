const express = require('express');
const Joi = require('joi');
const CustomError = require('../helpers/custom-error');
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
        next(new CustomError('User not found', 404));
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
    next(new CustomError('Invalid request body', 400));
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
    next(new CustomError('Invalid request body', 400));
  } else {
    User.find({ where: { id: req.params.id } })
      .then((user) => {
        if (!user) {
          next(new CustomError('User not found', 404));
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
        next(new CustomError('User not found', 404));
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
        next(new CustomError('User not found', 404));
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
        next(new CustomError('User not found', 404));
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
    .catch(next);
});

module.exports = router;
