import Teacher from './Teacher';
import Student from './Student';
import Class from './Class';
import Subject from './Subject';
import ClassStudentTeacher from './ClassStudentTeacher';
import { setupAssociations } from './associations';

// Setup associations
setupAssociations();

export {
  Teacher,
  Student,
  Class,
  Subject,
  ClassStudentTeacher,
  setupAssociations,
};
