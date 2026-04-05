import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Teacher extends Model {
  id!: number;
  email!: string;
  name!: string;
}

Teacher.init(
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
  },
  {
    sequelize,
    tableName: 'teachers',
    timestamps: true,
  },
);

export default Teacher;
