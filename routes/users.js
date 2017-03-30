const express = require('express');
const User = require('../models').User;

const router = express.Router();

// get user
router.get('/:id', (req, res) => (
  User.find({ where: { id: req.params.id } }).then(user => res.json({ user }))
));

// create user
router.post('/', (req, res) => (
  User.create({ name: req.body.name }).then(user => res.json({ user }))
));

// update user
router.patch('/:id', (req, res) => (
  User.find({ where: { id: req.params.id } }).then(user => (
    user.update(req.body).then(() => res.sendStatus(200))
  ))
));

// delete user
router.delete('/:id', (req, res) => (
  User.find({ where: { id: req.params.id } }).then(user => (
    user.destroy().then(() => res.sendStatus(200))
  ))
));

// get groups of user
router.get('/:id/groups', (req, res) => (
  User.find({ where: { id: req.params.id } }).then(user => (
    user.getGroups().then(groups => res.json(groups))
  ))
));

// get exercises of user
router.get('/:id/exercises', (req, res) => (
  User.find({ where: { id: req.params.id } }).then((user) => {
    const result = [];

    user.getExercises().then((exercises) => {
      let numOfIteratedExercises = 0;

      exercises.forEach(exercise => (
        exercise.getSets().then(sets => (
          exercise.getExerciseType().then((exerciseType) => {
            const extendedExercise = {
              id: exercise.id,
              note: exercise.note,
              createdAt: exercise.createdAt,
              sets,
              user,
              exerciseType,
            };

            result.push(extendedExercise);
            numOfIteratedExercises += 1;

            if (numOfIteratedExercises === exercises.length) {
              res.json(result);
            }
          })
        ))
      ));
    });
  })
));

module.exports = router;
