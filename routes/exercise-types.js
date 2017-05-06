const express = require('express');
const ExerciseType = require('../models').ExerciseType;
const Joi = require('joi');
const NotFoundError = require('../errors/not-found-error');
const InvalidRequestBodyError = require('../errors/invalid-request-body-error');

const router = express.Router();

/**
 * @api {get} /exercise-types List exercise types
 * @apiName GetExerciseTypes
 * @apiGroup ExerciseType
 *
 * @apiSuccess {Object[]} body List of exercise types.
 * @apiSuccess {String} body.name Unique name of the exercise.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/', (req, res, next) => {
  ExerciseType.findAll({ raw: true })
    .then(exerciseTypes => res.json(exerciseTypes))
    .catch(next);
});

/**
 * @api {get} /exercise-types/:name Get a single exercise type
 * @apiName GetExerciseType
 * @apiGroup ExerciseType
 *
 * @apiSuccess {String} name Unique name of the exercise.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.get('/:name', (req, res, next) => {
  ExerciseType.findById(req.params.name)
    .then((exerciseType) => {
      if (!exerciseType) {
        throw new NotFoundError('Exercise type not found');
      }

      res.json(exerciseType.toJSON());
    })
    .catch(next);
});

/**
 * @api {post} /exercise-types Create an exercise type
 * @apiName PostExerciseType
 * @apiGroup ExerciseType
 *
 * @apiParam {String} name Unique name of the exercise.
 *
 * @apiSuccess {String} name Unique name of the exercise.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.post('/', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    name: Joi.string().min(1).required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    ExerciseType.findOrCreate({ where: { name: req.body.name } })
      .spread(exerciseType => res.json(exerciseType.toJSON()))
      .catch(next);
  }
});

/**
 * @api {delete} /exercise-types/:name Delete an exercise type
 * @apiName DeleteExerciseType
 * @apiGroup ExerciseType
 */
router.delete('/:name', (req, res, next) => {
  ExerciseType.destroy({ where: { name: req.params.name } })
    .then((numDeletedRows) => {
      if (numDeletedRows === 0) {
        throw new NotFoundError('Exercise type not found');
      }

      res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;
