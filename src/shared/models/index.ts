import Teacher from './Teacher';
import Student from './Student';
import Class from './Class';
import Subject from './Subject';
import ClassStudent from './ClassStudent';
import TeacherClass from './TeacherClass';
import { setupAssociations } from './associations';

// Setup associations
setupAssociations();

export {
  Teacher,
  Student,
  Class,
  Subject,
  ClassStudent,
  TeacherClass,
  setupAssociations,
};
