const express = require('express');
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;
const User = require('../models').User;
const Set = require('../models').Set;
const Comment = require('../models').Comment;

const router = express.Router();

/**
 * Creates a new exercise.
 * @param {object} req - Request.
 * @param {object} res - Response.
 * @param {object} exerciseType - Type of the exercise.
 */
function createExercise(req, res, exerciseType) {
  Exercise.create({ note: req.body.note }).then(exercise => (
    exercise.setUser(req.body.userId).then(() => (
      exercise.setExerciseType(exerciseType).then(() => {
        let numInsertedSets = 0;
        const sets = [];

        // add sets to db
        req.body.sets.forEach(set => (
          Set.create(set).then((insertedSet) => {
            sets.push(insertedSet);
            insertedSet.setExercise(exercise);
            numInsertedSets += 1;

            if (numInsertedSets === req.body.sets.length) {
              // all sets were inserted in db
              User.find({ where: { id: req.body.userId } }).then((user) => {
                const result = {
                  id: exercise.id,
                  note: exercise.note,
                  createdAt: exercise.createdAt,
                  sets,
                  user,
                  exerciseType,
                };

                res.json(result);
              });
            }
          })
        ));
      })
    ))
  ));
}

// get exercises
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

      res.json({ exercises: result });
    });
});

// get exercise
router.get('/:id', (req, res) => {
  let exercise;
  let userOfExercise;
  let typeOfExercise;

  Exercise.find({ where: { id: req.params.id } })
    .then((foundExercise) => {
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

      res.json({ exercise: result });
    });
});

// create exercise
router.post('/', (req, res) => (
  // check if exercise type already exists
  ExerciseType.find({ where: { name: req.body.exerciseTypeName } }).then((exerciseType) => {
    if (exerciseType) {
      // exercise type exists
      createExercise(req, res, exerciseType);
    } else if (req.body.exerciseTypeName) {
      // create a new exercise type
      ExerciseType.create({ name: req.body.exerciseTypeName }).then(newExerciseType => (
        createExercise(req, res, newExerciseType)
      ));
    } else {
      // TODO return error because exerciseTypeName is not given
    }
  })
));

// update exercise
router.patch('/:id', (req, res) => (
  Exercise.find({ where: { id: req.params.id } }).then(exercise => (
    exercise.update(req.body).then(() => res.sendStatus(200))
  ))
));

// delete exercise
router.delete('/:id', (req, res) => (
  Exercise.find({ where: { id: req.params.id } }).then(exercise => (
    exercise.destroy().then(() => res.sendStatus(200))
  ))
));

// get sets of exercise
router.get('/:id/sets', (req, res) => (
  Exercise.find({ where: { id: req.params.id } }).then(exercise => (
    exercise.getSets().then(sets => res.json(sets))
  ))
));

// add set to exercise
router.post('/:id/sets', (req, res) => (
  Exercise.find({ where: { id: req.params.id } }).then(exercise => (
    Set.create(req.body.set).then(set => (
      set.setExercise(exercise).then(() => (res.sendStatus(200)))
    ))
  ))
));

// remove set of exercise
router.delete('/:exerciseId/sets/:setId', (req, res) => (
  Set.find({ where: { id: req.params.setId } }).then(set => (
    set.destroy().then(() => (res.sendStatus(200)))
  ))
));

// update set to exercise
router.patch('/:exerciseId/sets/:setId', (req, res) => (
  Set.find({ where: { id: req.params.setId } }).then(set => (
    set.update(req.body).then(() => (res.sendStatus(200)))
  ))
));

// get comments of exercise
router.get('/:id/comments', (req, res) => (
  Exercise.find({ where: { id: req.params.id } }).then(exercise => (
    exercise.getComments().then(comments => res.json(comments))
  ))
));

// add comment to exercise
router.post('/:id/comments', (req, res) => (
  Exercise.find({ where: { id: req.params.id } }).then(exercise => (
    Comment.create({ text: req.body.text }).then(comment => (
      comment.setExercise(exercise).then(() => (
        comment.setUser(req.body.userId).then(() => (res.sendStatus(200)))
      ))
    ))
  ))
));

// update comment of exercise
router.patch('/:exerciseId/comments/:commentId', (req, res) => (
  Comment.find({ where: { id: req.params.commentId } }).then(comment => (
    comment.update({ text: req.body.text }).then(() => (res.sendStatus(200)))
  ))
));

// delete comment of exercise
router.delete('/:exerciseId/comments/:commentId', (req, res) => (
  Comment.find({ where: { id: req.params.commentId } }).then(comment => (
    comment.destroy().then(() => (res.sendStatus(200)))
  ))
));

module.exports = router;
