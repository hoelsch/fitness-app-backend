const express = require('express');
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;
const User = require('../models').User;
const Set = require('../models').Set;
const Comment = require('../models').Comment;

const router = express.Router();

/**
 * @api {get} /exercises List exercises
 * @apiName GetExercises
 * @apiGroup Exercise
 *
 * @apiSuccess {Object[]} body List of exercises.
 * @apiSuccess {Number} body.id ID of the exercise.
 * @apiSuccess {String} body.note Note of the exercise.
 * @apiSuccess {Object[]} body.sets Sets of the exercise.
 * @apiSuccess {Object} body.user User of the exercise.
 * @apiSuccess {Object} body.exerciseType Type of the exercise.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/', (req, res) => {
  let exercises;
  let userOfExercises;
  let typesOfExercises;

  Exercise.findAll()
    .then((allExercises) => {
      exercises = allExercises;
      return Promise.all(exercises.map(exercise => exercise.getUser()));
    })
    .then((users) => {
      userOfExercises = users;
      return Promise.all(exercises.map(exercise => exercise.getExerciseType()));
    })
    .then((exerciseTypes) => {
      typesOfExercises = exerciseTypes;
      return Promise.all(exercises.map(exercise => exercise.getSets()));
    })
    .then((setsOfExercises) => {
      const result = exercises.map((exercise, index) => ({
        id: exercise.id,
        note: exercise.note,
        createdAt: exercise.createdAt,
        sets: setsOfExercises[index],
        user: userOfExercises[index],
        exerciseType: typesOfExercises[index],
      }));

      res.json(result);
    });
});

/**
 * @api {get} /exercises/:id Get a single exercise type
 * @apiName GetExercise
 * @apiGroup Exercise
 *
 * @apiSuccess {Number} id ID of the exercise.
 * @apiSuccess {String} note Note of the exercise.
 * @apiSuccess {Object[]} sets Sets of the exercise.
 * @apiSuccess {Object} user User of the exercise.
 * @apiSuccess {Object} exerciseType Type of the exercise.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.get('/:id', (req, res, next) => {
  let exercise;
  let userOfExercise;
  let typeOfExercise;

  Exercise.find({ where: { id: req.params.id } })
    .then((foundExercise) => {
      if (!foundExercise) {
        const err = new Error('Exercise not found');
        err.status = 404;
        throw err;
      }

      exercise = foundExercise;
      return exercise.getUser();
    })
    .then((user) => {
      userOfExercise = user;
      return exercise.getExerciseType();
    })
    .then((exerciseType) => {
      typeOfExercise = exerciseType;
      return exercise.getSets();
    })
    .then((setsOfExercise) => {
      const result = {
        id: exercise.id,
        note: exercise.note,
        createdAt: exercise.createdAt,
        sets: setsOfExercise,
        user: userOfExercise,
        exerciseType: typeOfExercise,
      };

      res.json(result);
    })
    .catch(err => next(err));
});

/**
 * @api {post} /exercises Create an exercise
 * @apiName PostExercise
 * @apiGroup Exercise
 *
 * @apiParam {String} exerciseTypeName Name of the exercise.
 * @apiParam {String} [note] Optional note of the exercise.
 * @apiParam {Number} userId ID of the user of the exercise.
 * @apiParam {Object[]} sets Sets of the exercise.
 *
 * @apiSuccess {Number} id ID of the exercise.
 * @apiSuccess {String} note Note of the exercise.
 * @apiSuccess {Object[]} sets Sets of the exercise.
 * @apiSuccess {Object} user User of the exercise.
 * @apiSuccess {Object} exerciseType Type of the exercise.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.post('/', (req, res) => {
  let exercise;
  let typeOfExercise;
  let setsOfExercise;

  ExerciseType.find({ where: { name: req.body.exerciseTypeName } })
    .then((exerciseType) => {
      if (exerciseType) {
        return exerciseType;
      }
      // exercise type does not exist --> create a new one
      return ExerciseType.create({ name: req.body.exerciseTypeName });
    })
    .then((exerciseType) => {
      typeOfExercise = exerciseType;
      return Exercise.create({ note: req.body.note });
    })
    .then((newExercise) => {
      exercise = newExercise;
      return exercise.setExerciseType(typeOfExercise);
    })
    .then(() => exercise.setUser(req.body.userId))
    .then(() => Promise.all(req.body.sets.map(set => Set.create(set))))
    .then((sets) => {
      setsOfExercise = sets;
      return User.find({ where: { id: req.body.userId } });
    })
    .then((user) => {
      const result = {
        user,
        id: exercise.id,
        note: exercise.note,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        sets: setsOfExercise,
        exerciseType: typeOfExercise,
      };

      res.json(result);
    });
});

/**
 * @api {patch} /exercises/:id Edit an exercise
 * @apiName PatchExercise
 * @apiGroup Exercise
 *
 * @apiParam {String} [exerciseTypeName] Optional name of the exercise.
 * @apiParam {String} [note] Optional note of the exercise.
 * @apiParam {Object[]} [sets] Optional sets of the exercise.
 *
 * @apiSuccess {Number} id ID of the exercise type.
 * @apiSuccess {String} name Name of the exercise.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.patch('/:id', (req, res, next) => (
  Exercise.find({ where: { id: req.params.id } })
    .then((exercise) => {
      if (!exercise) {
        const err = new Error('Exercise not found');
        err.status = 404;
        throw err;
      }

      return exercise.update(req.body);
    })
    .then(() => res.sendStatus(204))
    .catch(err => next(err))
));

/**
 * @api {delete} /exercises/:id Delete an exercise
 * @apiName DeleteExercise
 * @apiGroup Exercise
 */
router.delete('/:id', (req, res, next) => (
  Exercise.find({ where: { id: req.params.id } })
    .then((exercise) => {
      if (!exercise) {
        const err = new Error('Exercise not found');
        err.status = 404;
        throw err;
      }

      return exercise.destroy();
    })
    .then(() => res.sendStatus(204))
    .catch(err => next(err))
));

/**
 * @api {get} /exercises/:id/sets List sets of exercise
 * @apiName GetExerciseSets
 * @apiGroup Exercise
 *
 * @apiSuccess {Object[]} body List of sets of an exercise.
 * @apiSuccess {Number} body.id ID of the set.
 * @apiSuccess {Number} body.numReps Number of reps.
 * @apiSuccess {Number} body.weight Weight.
 * @apiSuccess {Number} body.ExerciseId ID of the corresponding exercise.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/:id/sets', (req, res, next) => (
  Exercise.find({ where: { id: req.params.id } })
    .then((exercise) => {
      if (!exercise) {
        const err = new Error('Exercise not found');
        err.status = 404;
        throw err;
      }

      return exercise.getSets();
    })
    .then(sets => res.json(sets))
    .catch(err => next(err))
));

/**
 * @api {post} /exercises/:id/sets Create a set for an exercise
 * @apiName PostExerciseSet
 * @apiGroup Exercise
 *
 * @apiParam {Number} numReps Number of reps.
 * @apiParam {Number} weight Weight.
 */
router.post('/:id/sets', (req, res, next) => {
  let exercise;

  Exercise.find({ where: { id: req.params.id } })
    .then((exer) => {
      if (!exer) {
        const err = new Error('Exercise not found');
        err.status = 404;
        throw err;
      }

      exercise = exer;
      return Set.create(req.body.set);
    })
    .then(set => set.setExercise(exercise))
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

/**
 * @api {delete} /exercises/:exercise-id/sets/:set-id Delete a set of an exercise
 * @apiName DeleteExerciseSet
 * @apiGroup Exercise
 */
router.delete('/:exerciseId/sets/:setId', (req, res, next) => (
  Set.find({ where: { id: req.params.setId } })
    .then((set) => {
      if (!set) {
        const err = new Error('Set not found');
        err.status = 404;
        throw err;
      }

      return set.destroy();
    })
    .then(() => res.sendStatus(204))
    .catch(err => next(err))
));

/**
 * @api {patch} /exercise/:exercise-id/sets/:set-id Edit a set of an exercise
 * @apiName PatchExerciseSet
 * @apiGroup Exercise
 *
 * @apiParam {Number} [numRep] Optional number of reps.
 * @apiParam {Number} [weight] Weight.
 */
router.patch('/:exerciseId/sets/:setId', (req, res, next) => (
  Set.find({ where: { id: req.params.setId } })
    .then((set) => {
      if (!set) {
        const err = new Error('Set not found');
        err.status = 404;
        throw err;
      }

      return set.update(req.body);
    })
    .then(() => res.sendStatus(204))
    .catch(err => next(err))
));

/**
 * @api {get} /exercises/:id/comments List comments of exercise
 * @apiName GetExerciseComments
 * @apiGroup Exercise
 *
 * @apiSuccess {Object[]} body List of comments of an exercise.
 * @apiSuccess {Number} body.id ID of the comment.
 * @apiSuccess {String} body.text Text of the comment.
 * @apiSuccess {Object} body.user User that posted the comment.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/:id/comments', (req, res, next) => {
  let commentsOfExercise;

  Exercise.find({ where: { id: req.params.id } })
    .then((exercise) => {
      if (!exercise) {
        const err = new Error('Exercise not found');
        err.status = 404;
        throw err;
      }

      return exercise.getComments();
    })
    .then((comments) => {
      commentsOfExercise = comments;
      return Promise.all(comments.map(comment => comment.getUser()));
    })
    .then(users => (
      Promise.all(commentsOfExercise.map((comment, index) => ({
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: users[index],
      })))
    ))
    .then(result => res.json(result))
    .catch(err => next(err));
});

/**
 * @api {post} /exercises/:id/comments Create a comment for an exercise
 * @apiName PostExerciseComment
 * @apiGroup Exercise
 *
 * @apiParam {String} text Text of the comment.
 * @apiParam {Number} userId ID of the user posting the comment.
 */
router.post('/:id/comments', (req, res, next) => {
  let exercise;
  let comment;

  Exercise.find({ where: { id: req.params.id } })
    .then((exer) => {
      if (!exer) {
        const err = new Error('Exercise not found');
        err.status = 404;
        throw err;
      }

      exercise = exer;
      return User.find({ where: { id: req.body.userId } });
    })
    .then((user) => {
      if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }

      return Comment.create({ text: req.body.text });
    })
    .then((newComment) => {
      comment = newComment;
      return comment.setExercise(exercise);
    })
    .then(() => comment.setUser(req.body.userId))
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

/**
 * @api {patch} /exercises/:exercise-id/comments/:comment-id Edit a comment of an exercise
 * @apiName PatchExerciseComment
 * @apiGroup Exercise
 *
 * @apiParam {String} text Text of the comment.
 */
router.patch('/:exerciseId/comments/:commentId', (req, res, next) => (
  Comment.find({ where: { id: req.params.commentId } })
    .then((comment) => {
      if (!comment) {
        const err = new Error('Comment not found');
        err.status = 404;
        throw err;
      }

      return comment.update({ text: req.body.text });
    })
    .then(() => res.sendStatus(204))
    .catch(err => next(err))
));

/**
 * @api {delete} /exercises/:exercise-id/comments/:comment-id Delete a comment of an exercise
 * @apiName DeleteExerciseComment
 * @apiGroup Exercise
 */
router.delete('/:exerciseId/comments/:commentId', (req, res, next) => (
  Comment.find({ where: { id: req.params.commentId } })
    .then((comment) => {
      if (!comment) {
        const err = new Error('Comment not found');
        err.status = 404;
        throw err;
      }

      return comment.destroy();
    })
    .then(() => res.sendStatus(204))
    .catch(err => next(err))
));

module.exports = router;
