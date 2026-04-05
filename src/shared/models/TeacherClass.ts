import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class TeacherClass extends Model {
  id!: number;
  teacherId!: number;
  classId!: number;
}

TeacherClass.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'id',
      },
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'teacherClasses',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['teacherId', 'classId'],
      },
    ],
  },
);

export default TeacherClass;
