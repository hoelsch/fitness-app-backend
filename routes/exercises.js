const express = require('express');
const Joi = require('joi');
const NotFoundError = require('../errors/not-found-error');
const InvalidRequestBodyError = require('../errors/invalid-request-body-error');
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;
const User = require('../models').User;
const Set = require('../models').Set;
const Comment = require('../models').Comment;
const sequelize = require('../models').sequelize;

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
router.get('/', (req, res, next) => {
  Exercise.findAll({ include: [User, ExerciseType, Set] })
    .then(exercises => res.json(exercises.map(exercise => ({
      id: exercise.id,
      note: exercise.note,
      sets: exercise.Sets,
      user: exercise.User,
      exerciseType: exercise.ExerciseType,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    }))))
    .catch(next);
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
  Exercise.findAll({ where: { id: req.params.id }, include: [User, ExerciseType, Set] })
    .then((exercises) => {
      const exercise = exercises[0];
      if (!exercise) {
        throw new NotFoundError('Exercise not found');
      }

      res.json({
        id: exercise.id,
        note: exercise.note,
        sets: exercise.Sets,
        user: exercise.User,
        exerciseType: exercise.ExerciseType,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
      });
    })
    .catch(next);
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
router.post('/', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    exerciseTypeName: Joi.string().required(),
    note: Joi.string().optional(),
    userId: Joi.number().required(),
    sets: Joi.array().items(Joi.object().keys({
      numReps: Joi.number(),
      weight: Joi.number(),
    })).required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    sequelize.transaction(() => {
      let exercise;
      let typeOfExercise;
      let userOfExercise;
      let setsOfExercise;

      // find user of the exercise
      return User.findById(req.body.userId)
        .then((user) => {
          if (!user) {
            throw new NotFoundError('User not found');
          }

          userOfExercise = user;
          // update total weight lifted by the user
          let totalWeight = userOfExercise.totalWeightLifted;
          const sets = req.body.sets;
          sets.forEach((set) => { totalWeight += set.numReps * set.weight; });

          return user.update({ totalWeightLifted: totalWeight });
        })
        // find type of exercise
        .then(() => ExerciseType.findOrCreate({ where: { name: req.body.exerciseTypeName } }))
        .spread((exerciseType) => {
          typeOfExercise = exerciseType;
          return Exercise.create({ note: req.body.note });
        })
        .then((newExercise) => {
          exercise = newExercise;
          // create relationship between exercise and its type
          return exercise.setExerciseType(typeOfExercise);
        })
        .then(() => exercise.setUser(req.body.userId))
        .then(() => Promise.all(req.body.sets.map(set => Set.create(set))))
        .then((sets) => {
          setsOfExercise = sets;
          return exercise.setSets(setsOfExercise);
        })
        // create and return response object
        .then(() => ({
          id: exercise.id,
          note: exercise.note,
          createdAt: exercise.createdAt,
          updatedAt: exercise.updatedAt,
          user: userOfExercise,
          sets: setsOfExercise,
          exerciseType: typeOfExercise,
        }));
    })
      .then(result => res.json(result))
      .catch(next);
  }
});

/**
 * @api {patch} /exercises/:id Edit an exercise
 * @apiName PatchExercise
 * @apiGroup Exercise
 *
 * @apiParam {String} [exerciseTypeName] Optional name of the exercise.
 * @apiParam {String} [note] Optional note of the exercise.
 * @apiParam {Object[]} [sets] Optional sets of the exercise.
 */
router.patch('/:id', (req, res, next) => {
  const { error } = Joi.validate(req.body, Joi.object().keys({
    exerciseTypeName: Joi.string().optional(),
    note: Joi.string().optional(),
    sets: Joi.array().items(Joi.object().keys({
      numReps: Joi.number(),
      weight: Joi.number(),
    })).optional(),
  }).min(1));

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    sequelize.transaction(() => {
      let exercise;
      let oldSetsOfExercise;
      let weightOfOldSets = 0;
      let weightOfNewSets = 0;
      const newSetsOfExercise = req.body.sets;

      return Exercise.findById(req.params.id)
        .then((foundExercise) => {
          if (!foundExercise) {
            throw new NotFoundError('Exercise not found');
          }

          exercise = foundExercise;
          // check if the note of the exercise has to be updated
          return req.body.note && exercise.update({ note: req.body.note });
        })
        // check if type of exercise has to be changed
        .then(() => req.body.exerciseTypeName && ExerciseType.findOrCreate({
          where: { name: req.body.exerciseTypeName },
        }))
        .spread(exerciseType => exerciseType && exercise.setExerciseType(exerciseType))
        // check if sets have to be updated
        // if yes --> get existing sets of exercise
        .then(() => req.body.sets && exercise.getSets())
        // if sets have to be updated, remove old sets
        .then((sets) => {
          oldSetsOfExercise = sets;
          if (oldSetsOfExercise) {
            // before deleting the old sets, we have to get their total weight
            // the old total weight has to be subtracted from the total weight lifted by the user
            oldSetsOfExercise.forEach((oldSet) => {
              weightOfOldSets += oldSet.numReps * oldSet.weight;
            });

            // compute total weight of new sets
            newSetsOfExercise.forEach((newSet) => {
              weightOfNewSets += newSet.numReps * newSet.weight;
            });
          }

          // delete old sets
          return newSetsOfExercise && Set.destroy({ where: { ExerciseId: exercise.id } });
        })
        // create new sets
        .then(() => newSetsOfExercise && Promise.all(newSetsOfExercise.map(set => Set.create(set))))
        // add relationship between exercise and new sets
        .then(newSets => newSets && exercise.setSets(newSets))
        // update total lifted weight of user (but only when the exercise sets were updated)
        .then(() => newSetsOfExercise && exercise.getUser())
        .then(user => newSetsOfExercise && user.update({
          totalWeightLifted: (user.totalWeightLifted + (weightOfNewSets - weightOfOldSets)),
        }));
    })
      .then(() => res.sendStatus(204))
      .catch(next);
  }
});

/**
 * @api {delete} /exercises/:id Delete an exercise
 * @apiName DeleteExercise
 * @apiGroup Exercise
 */
router.delete('/:id', (req, res, next) => {
  sequelize.transaction(() => (
    Exercise.findAll({ where: { id: req.params.id }, include: [Set, User] })
      .then((exercises) => {
        const exercise = exercises[0];
        if (!exercise) {
          throw new NotFoundError('Exercise not found');
        }

        const sets = exercise.Sets;
        const user = exercise.User;

        if (sets && sets.length > 0) {
          // before the exercise can be deleted,
          // the total weight lifted by the user has to be udpated
          const totalWeightOfExercise = sets.reduce((totalWeight, set) => (
            totalWeight + (set.numReps * set.weight)
          ), 0);

          const newTotalWeightLifted = user.totalWeightLifted - totalWeightOfExercise;

          return Promise.all([
            user.update({ totalWeightLifted: newTotalWeightLifted }),
            exercise.destroy(),
          ]);
        }

        return exercise.destroy();
      })
  ))
    .then(() => res.sendStatus(204))
    .catch(next);
});

/**
 * @api {get} /exercises/:id/sets List sets of exercise
 * @apiName GetExerciseSets
 * @apiGroup Exercise
 *
 * @apiSuccess {Object[]} body List of sets of an exercise.
 * @apiSuccess {Number} body.id ID of the set.
 * @apiSuccess {Number} body.numReps Number of reps.
 * @apiSuccess {Number} body.weight Weight in kg.
 * @apiSuccess {Number} body.ExerciseId ID of the corresponding exercise.
 * @apiSuccess {String} body.createdAt Date of creation.
 * @apiSuccess {String} body.updatedAt Date of last update.
 */
router.get('/:id/sets', (req, res, next) => {
  Exercise.findAll({ where: { id: req.params.id }, include: [Set] })
    .then((exercises) => {
      const exercise = exercises[0];
      if (!exercise) {
        throw new NotFoundError('Exercise not found');
      }

      res.json(exercise.toJSON().Sets);
    })
    .catch(next);
});

/**
 * @api {post} /exercises/:id/sets Create a set for an exercise
 * @apiName PostExerciseSet
 * @apiGroup Exercise
 *
 * @apiParam {Number} numReps Number of reps.
 * @apiParam {Number} weight Weight in kg.
 *
 * @apiSuccess {Number} id ID of the set.
 * @apiSuccess {Number} numReps Number of reps.
 * @apiSuccess {Number} weight Weight in kg.
 * @apiSuccess {String} createdAt Date of creation.
 * @apiSuccess {String} updatedAt Date of last update.
 */
router.post('/:id/sets', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    numReps: Joi.number().required(),
    weight: Joi.number().required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    sequelize.transaction(() => {
      let exercise;
      let set;

      return Exercise.findAll({ where: { id: req.params.id }, include: [User] })
        .then((exercises) => {
          exercise = exercises[0];
          if (!exercise) {
            throw new NotFoundError('Exercise not found');
          }

          const user = exercise.User;
          // update total weight lifted by the user
          const newTotalWeightLifted = user.totalWeightLifted
            + (req.body.numReps * req.body.weight);

          return user.update({ totalWeightLifted: newTotalWeightLifted });
        })
        .then(() => Set.create(req.body))
        .then((newSet) => {
          set = newSet;
          return exercise.addSet(set);
        })
        .then(() => set);
    })
      .then(result => res.json(result.toJSON()))
      .catch(next);
  }
});

/**
 * @api {delete} /exercises/:exercise-id/sets/:set-id Delete a set of an exercise
 * @apiName DeleteExerciseSet
 * @apiGroup Exercise
 */
router.delete('/:exerciseId/sets/:setId', (req, res, next) => {
  sequelize.transaction(() => {
    let totalWeightOfSet = 0;

    return Set.findById(req.params.setId)
      .then((set) => {
        if (!set) {
          throw new NotFoundError('Set not found');
        }

        // remember weight of set to update user
        totalWeightOfSet = set.numReps * set.weight;
        return set.destroy();
      })
      .then(() => Exercise.findAll({ where: { id: req.params.exerciseId }, include: [User] }))
      .then((exercises) => {
        const exercise = exercises[0];
        if (!exercise) {
          throw new NotFoundError('Exercise not found');
        }

        const user = exercise.User;
        return user.update({ totalWeightLifted: user.totalWeightLifted - totalWeightOfSet });
      });
  })
    .then(() => res.sendStatus(204))
    .catch(next);
});

/**
 * @api {patch} /exercise/:exercise-id/sets/:set-id Edit a set of an exercise
 * @apiName PatchExerciseSet
 * @apiGroup Exercise
 *
 * @apiParam {Number} [numRep] Optional number of reps.
 * @apiParam {Number} [weight] Weight in kg.
 */
router.patch('/:exerciseId/sets/:setId', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    numReps: Joi.number().optional(),
    weight: Joi.number().optional(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    sequelize.transaction(() => {
      let oldWeightOfSet;

      return Set.findById(req.params.setId)
        .then((set) => {
          if (!set) {
            throw new NotFoundError('Set not found');
          }

          // remember old weight of set to update user
          oldWeightOfSet = set.numReps * set.weight;
          return set.update(req.body);
        })
        .then(() => Exercise.findAll({ where: { id: req.params.exerciseId }, include: [User] }))
        .then((exercises) => {
          const exercise = exercises[0];
          if (!exercise) {
            throw new NotFoundError('Exercise not found');
          }

          const user = exercise.User;
          const newWeightOfSet = req.body.numReps * req.body.weight;

          // update total weight lifted by user
          return user.update({
            totalWeightLifted: user.totalWeightLifted + (newWeightOfSet - oldWeightOfSet),
          });
        });
    })
      .then(() => res.sendStatus(204))
      .catch(next);
  }
});

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
  Exercise.findAll({
    where: { id: req.params.id },
    include: [{ model: Comment, include: [User] }],
  })
    .then((exercises) => {
      const exercise = exercises[0];
      if (!exercise) {
        throw new NotFoundError('Exercise not found');
      }

      const comments = exercise.Comments;

      res.json(comments.map(comment => ({
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.User,
      })));
    })
    .catch(next);
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
  const { error } = Joi.validate(req.body, {
    text: Joi.string().required(),
    userId: Joi.number().required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    let exercise;

    Exercise.findById(req.params.id)
      .then((foundExercise) => {
        if (!foundExercise) {
          throw new NotFoundError('Exercise not found');
        }

        exercise = foundExercise;
        return User.findById(req.body.userId);
      })
      .then((user) => {
        if (!user) {
          throw new NotFoundError('User not found');
        }

        return Comment.create({ text: req.body.text });
      })
      .then(comment => Promise.all([
        exercise.addComment(comment),
        comment.setUser(req.body.userId),
      ]))
      .then(() => res.sendStatus(204))
      .catch(next);
  }
});

/**
 * @api {patch} /exercises/:exercise-id/comments/:comment-id Edit a comment of an exercise
 * @apiName PatchExerciseComment
 * @apiGroup Exercise
 *
 * @apiParam {String} text Text of the comment.
 */
router.patch('/:exerciseId/comments/:commentId', (req, res, next) => {
  const { error } = Joi.validate(req.body, {
    text: Joi.string().required(),
  });

  if (error) {
    next(new InvalidRequestBodyError());
  } else {
    Comment.update({ text: req.body.text }, { where: { id: req.params.commentId } })
      .spread((numUpdatedComments) => {
        if (numUpdatedComments === 0) {
          throw new NotFoundError('Comment not found');
        }

        res.sendStatus(204);
      })
      .catch(next);
  }
});

/**
 * @api {delete} /exercises/:exercise-id/comments/:comment-id Delete a comment of an exercise
 * @apiName DeleteExerciseComment
 * @apiGroup Exercise
 */
router.delete('/:exerciseId/comments/:commentId', (req, res, next) => (
  Comment.destroy({ where: { id: req.params.commentId } })
    .then((numDeletedComments) => {
      if (numDeletedComments === 0) {
        throw new NotFoundError('Comment not found');
      }

      res.sendStatus(204);
    })
    .catch(next)
));

module.exports = router;
