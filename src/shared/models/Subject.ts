import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Subject extends Model {
  id!: number;
  code!: string;
  name!: string;
}

Subject.init(
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
  },
  {
    sequelize,
    tableName: 'subjects',
    timestamps: true,
  },
);

export default Subject;
