import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Teacher from './Teacher';
import Subject from './Subject';

class ClassStudentTeacher extends Model {
  id!: number;
  classId!: number;
  studentId!: number;
  teacherId!: number;
  subjectId!: number;
  Teacher?: Teacher;
  Subject?: Subject;
}

ClassStudentTeacher.init(
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
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'id',
      },
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'classStudentTeachers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['teacherId', 'studentId', 'classId', 'subjectId'],
        name: 'unique_teacher_student_class_subject',
      },
    ],
  },
);

export default ClassStudentTeacher;
