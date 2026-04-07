import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Student from './Student';

class Class extends Model {
  id!: number;
  code!: string;
  name!: string;
  subjectId!: number;
  students?: Student[];
}

Class.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    tableName: 'classes',
    timestamps: true,
  },
);

export default Class;
