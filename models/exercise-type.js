module.exports = (sequelize, DataTypes) => {
  const ExerciseType = sequelize.define('ExerciseType', {
    name: DataTypes.STRING,
  }, {
    classMethods: {
      associate: (models) => {
        // an exercise type can have many exercises
        ExerciseType.hasMany(models.Exercise);
      },
    },
  });

  return ExerciseType;
};

