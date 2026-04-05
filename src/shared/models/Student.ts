import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Student extends Model {
  id!: number;
  email!: string;
  name!: string;
  toDelete!: number;
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    toDelete: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'students',
    timestamps: true,
  },
);

export default Student;
