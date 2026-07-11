import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { Gender } from '../constants/enums.js';

export interface PatientProfileModel extends Model<InferAttributes<PatientProfileModel>, InferCreationAttributes<PatientProfileModel>> {
  id: CreationOptional<number>;
  userId: number;
  
  // Thông tin nhân khẩu học bổ sung
  dateOfBirth: CreationOptional<Date | null>;
  gender: CreationOptional<Gender | null>;
  emergencyContactName: CreationOptional<string | null>;
  emergencyContactPhone: CreationOptional<string | null>;
  
  // Tiền sử sức khỏe toàn thân (ảnh hưởng trực tiếp đến can thiệp nha khoa)
  bloodType: CreationOptional<string | null>;
  allergies: CreationOptional<string | null>;        // Dị ứng (đặc biệt thuốc tê Lidocaine, kháng sinh Penicillin, Latex)
  chronicDiseases: CreationOptional<string | null>;  // Bệnh mãn tính (Tim mạch, Cao huyết áp, Tiểu đường, Máu khó đông)
  currentMedications: CreationOptional<string | null>;// Thuốc đang dùng (chống đông máu Aspirin, Insulin)
  
  // Tình trạng & Thói quen đặc thù nha khoa
  isSmoking: CreationOptional<boolean>;              // Hút thuốc lá (ảnh hưởng đào thải Implant và lành thương)
  hasBruxism: CreationOptional<boolean>;             // Nghiến răng (ảnh hưởng phục hình răng sứ, veneers)
  isPregnant: CreationOptional<boolean>;             // Đang mang thai (hạn chế chụp X-quang răng và thuốc tê)
  
  // Tiền sử nha khoa & lý do khám
  dentalHistory: CreationOptional<string | null>;     // Tiền sử làm răng trước đây (Niềng răng, Implant...)
  chiefComplaint: CreationOptional<string | null>;    // Lý do chính đến khám (Đau răng, Thẩm mỹ sứ, Niềng răng...)
  
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const PatientProfile = sequelize.define<PatientProfileModel>('PatientProfile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM(...Object.values(Gender)),
    allowNull: true,
  },
  emergencyContactName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  emergencyContactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  bloodType: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  chronicDiseases: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  currentMedications: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isSmoking: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  hasBruxism: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isPregnant: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  dentalHistory: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  chiefComplaint: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default PatientProfile;
