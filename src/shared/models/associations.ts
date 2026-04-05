import Teacher from './Teacher';
import Student from './Student';
import Class from './Class';
import Subject from './Subject';
import ClassStudent from './ClassStudent';
import TeacherClass from './TeacherClass';

export const setupAssociations = () => {
  // Teacher has many Classes through TeacherClass (Many-to-Many)
  Teacher.belongsToMany(Class, {
    through: TeacherClass,
    foreignKey: 'teacherId',
    otherKey: 'classId',
    as: 'classes',
  });

  // Class has many Teachers through TeacherClass (Many-to-Many)
  Class.belongsToMany(Teacher, {
    through: TeacherClass,
    foreignKey: 'classId',
    otherKey: 'teacherId',
    as: 'teachers',
  });

  // Class belongs to Subject
  Class.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'subject',
  });

  // Subject has many Classes
  Subject.hasMany(Class, {
    foreignKey: 'subjectId',
    as: 'classes',
  });

  // Class has many Students through ClassStudent
  Class.belongsToMany(Student, {
    through: ClassStudent,
    foreignKey: 'classId',
    otherKey: 'studentId',
    as: 'students',
  });

  // Student has many Classes through ClassStudent
  Student.belongsToMany(Class, {
    through: ClassStudent,
    foreignKey: 'studentId',
    otherKey: 'classId',
    as: 'classes',
  });
};

export { Teacher, Student, Class, Subject, ClassStudent, TeacherClass };
