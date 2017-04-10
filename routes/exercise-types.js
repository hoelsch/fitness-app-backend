const express = require('express');
const ExerciseType = require('../models').ExerciseType;

const router = express.Router();

// get exercise types
router.get('/', (req, res) => (
  ExerciseType.findAll().then(exerciseType => res.json({ exerciseType }))
));

// get exercise type
router.get('/:id', (req, res) => (
  ExerciseType.find({ where: { id: req.params.id } })
    .then(exerciseType => res.json({ exerciseType }))
));

// create exercise type
router.post('/', (req, res) => (
  ExerciseType.create({ name: req.body.name }).then(exerciseType => res.json(exerciseType))
));

// update exercise type
router.patch('/:id', (req, res) => (
  ExerciseType.find({ where: { id: req.params.id } })
    .then(exerciseType => exerciseType.update(req.body))
    .then(updatedExerciseType => res.json(updatedExerciseType))
));

// delete exercise type
router.delete('/:id', (req, res) => (
  ExerciseType.find({ where: { id: req.params.id } })
    .then(exerciseType => exerciseType.destroy())
    .then(() => res.sendStatus(200))
));

module.exports = router;
