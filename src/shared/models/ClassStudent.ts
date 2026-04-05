import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ClassStudent extends Model {
  id!: number;
  classId!: number;
  studentId!: number;
}

ClassStudent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'classStudents',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['classId', 'studentId'],
      },
    ],
  },
);

export default ClassStudent;
