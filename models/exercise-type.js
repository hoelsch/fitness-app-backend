module.exports = (sequelize, DataTypes) => {
  const ExerciseType = sequelize.define('ExerciseType', {
    name: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
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

