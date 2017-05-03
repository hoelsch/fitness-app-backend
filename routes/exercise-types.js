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
 * @apiSuccess {Number} body.id ID of the exercise type.
 * @apiSuccess {String} body.name Name of the exercise.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/', (req, res) => {
  ExerciseType.findAll().then(exerciseTypes => res.json(exerciseTypes));
});

/**
 * @api {get} /exercise-types/:id Get a single exercise type
 * @apiName GetExerciseType
 * @apiGroup ExerciseType
 *
 * @apiSuccess {Number} id ID of the exercise type.
 * @apiSuccess {String} name Name of the exercise.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.get('/:id', (req, res, next) => {
  ExerciseType.findById(req.params.id)
    .then((exerciseType) => {
      if (!exerciseType) {
        next(new NotFoundError('Exercise type not found'));
      } else {
        res.json(exerciseType);
      }
    });
});

/**
 * @api {post} /exercise-types Create an exercise type
 * @apiName PostExerciseType
 * @apiGroup ExerciseType
 *
 * @apiParam {String} name Name of the exercise.
 *
 * @apiSuccess {Number} id ID of the exercise type.
 * @apiSuccess {String} name Name of the exercise.
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
    ExerciseType.create({ name: req.body.name })
      .then(exerciseType => res.json(exerciseType));
  }
});

/**
 * @api {patch} /exercise-types/:id Edit an exercise type
 * @apiName PatchExerciseType
 * @apiGroup ExerciseType
 *
 * @apiParam {String} name Name of the exercise.
 *
 * @apiSuccess {Number} id ID of the exercise type.
 * @apiSuccess {String} name Name of the exercise.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.patch('/:id', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    name: Joi.string().min(1).required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    ExerciseType.findById(req.params.id)
      .then((exerciseType) => {
        if (!exerciseType) {
          throw new NotFoundError('Exercise type not found');
        }

        return exerciseType.update(req.body);
      })
      .then(updatedExerciseType => res.json(updatedExerciseType))
      .catch(next);
  }
});

/**
 * @api {delete} /exercise-types/:id Delete an exercise type
 * @apiName DeleteExerciseType
 * @apiGroup ExerciseType
 */
router.delete('/:id', (req, res, next) => {
  ExerciseType.destroy({ where: { id: req.params.id } })
    .then((numDeletedRows) => {
      if (numDeletedRows === 0) {
        throw new NotFoundError('Exercise type not found');
      }

      res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;
