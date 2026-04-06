import Teacher from './Teacher';
import Student from './Student';
import Class from './Class';
import Subject from './Subject';
import ClassStudentTeacher from './ClassStudentTeacher';

export const setupAssociations = () => {
  // Teacher teaches Class through ClassStudentTeacher (Many-to-Many)
  Teacher.belongsToMany(Class, {
    through: { model: ClassStudentTeacher, unique: false },
    foreignKey: 'teacherId',
    otherKey: 'classId',
    as: 'classes',
  });

  // Class has many Teachers through ClassStudentTeacher (Many-to-Many)
  Class.belongsToMany(Teacher, {
    through: { model: ClassStudentTeacher, unique: false },
    foreignKey: 'classId',
    otherKey: 'teacherId',
    as: 'teachers',
  });

  // Teacher teaches Student through ClassStudentTeacher (Many-to-Many)
  Teacher.belongsToMany(Student, {
    through: { model: ClassStudentTeacher, unique: false },
    foreignKey: 'teacherId',
    otherKey: 'studentId',
    as: 'students',
  });

  // Student is taught by Teachers through ClassStudentTeacher (Many-to-Many)
  Student.belongsToMany(Teacher, {
    through: { model: ClassStudentTeacher, unique: false },
    foreignKey: 'studentId',
    otherKey: 'teacherId',
    as: 'teachers',
  });

  // Teacher teaches Subject through ClassStudentTeacher (Many-to-Many)
  Teacher.belongsToMany(Subject, {
    through: { model: ClassStudentTeacher, unique: false },
    foreignKey: 'teacherId',
    otherKey: 'subjectId',
    as: 'subjects',
  });

  // Subject is taught by Teachers through ClassStudentTeacher (Many-to-Many)
  Subject.belongsToMany(Teacher, {
    through: { model: ClassStudentTeacher, unique: false },
    foreignKey: 'subjectId',
    otherKey: 'teacherId',
    as: 'teachers',
  });

  // Student has Classes through ClassStudentTeacher (Many-to-Many)
  Student.belongsToMany(Class, {
    through: { model: ClassStudentTeacher, unique: false },
    foreignKey: 'studentId',
    otherKey: 'classId',
    as: 'classes',
  });

  // Class has Students through ClassStudentTeacher (Many-to-Many)
  Class.belongsToMany(Student, {
    through: { model: ClassStudentTeacher, unique: false },
    foreignKey: 'classId',
    otherKey: 'studentId',
    as: 'students',
  });

  // Class belongs to Subject (One-to-Many)
  Class.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'subject',
  });

  // Subject has many Classes (One-to-Many)
  Subject.hasMany(Class, {
    foreignKey: 'subjectId',
    as: 'classes',
  });

  // ClassStudentTeacher belongs to Teacher (One-to-Many)
  ClassStudentTeacher.belongsTo(Teacher, {
    foreignKey: 'teacherId',
    as: 'Teacher',
  });

  // Teacher has many ClassStudentTeacher records (One-to-Many)
  Teacher.hasMany(ClassStudentTeacher, {
    foreignKey: 'teacherId',
    as: 'classStudentTeachers',
  });

  // ClassStudentTeacher belongs to Subject (One-to-Many)
  ClassStudentTeacher.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'Subject',
  });

  // Subject has many ClassStudentTeacher records (One-to-Many)
  Subject.hasMany(ClassStudentTeacher, {
    foreignKey: 'subjectId',
    as: 'classStudentTeachers',
  });
};

export { Teacher, Student, Class, Subject, ClassStudentTeacher };
