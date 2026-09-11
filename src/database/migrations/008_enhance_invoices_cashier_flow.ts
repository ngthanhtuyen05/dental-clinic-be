import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '008_enhance_invoices_cashier_flow';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  // 1. Thêm cột items (dòng hàng JSON)
  try {
    await queryInterface.addColumn('Invoices', 'items', {
      type: DataTypes.JSON,
      allowNull: true,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }

  // 2. Thêm cột paidAmount (số tiền đã thanh toán)
  try {
    await queryInterface.addColumn('Invoices', 'paidAmount', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }

  // 3. Thêm cột remainingAmount (số tiền còn nợ)
  try {
    await queryInterface.addColumn('Invoices', 'remainingAmount', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }

  // 4. Thêm cột transactionRef (mã tham chiếu giao dịch POS / Chuyển khoản)
  try {
    await queryInterface.addColumn('Invoices', 'transactionRef', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }

  // 5. Cập nhật ENUM status hỗ trợ partial_paid
  try {
    await sequelize.query(`
      ALTER TABLE Invoices 
      MODIFY COLUMN status ENUM('unpaid', 'partial_paid', 'paid', 'cancelled') NOT NULL DEFAULT 'unpaid';
    `);
  } catch (err: any) {
    console.warn('[Migration 008] Warning updating status enum:', err.message);
  }

  // 6. Cập nhật ENUM paymentMethod hỗ trợ pos_card
  try {
    await sequelize.query(`
      ALTER TABLE Invoices 
      MODIFY COLUMN paymentMethod ENUM('cash', 'bank_transfer', 'pos_card', 'momo') NULL;
    `);
  } catch (err: any) {
    console.warn('[Migration 008] Warning updating paymentMethod enum:', err.message);
  }

  // 7. Khởi tạo paidAmount và remainingAmount cho dữ liệu lịch sử
  try {
    await sequelize.query(`
      UPDATE Invoices
      SET 
        paidAmount = CASE 
          WHEN status = 'paid' THEN GREATEST(0, totalAmount - discountAmount)
          ELSE 0 
        END,
        remainingAmount = CASE 
          WHEN status = 'paid' THEN 0
          ELSE GREATEST(0, totalAmount - discountAmount)
        END
      WHERE paidAmount = 0 AND remainingAmount = 0;
    `);
  } catch (err: any) {
    console.warn('[Migration 008] Warning initializing amounts:', err.message);
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.removeColumn('Invoices', 'items');
  } catch (_) {}

  try {
    await queryInterface.removeColumn('Invoices', 'paidAmount');
  } catch (_) {}

  try {
    await queryInterface.removeColumn('Invoices', 'remainingAmount');
  } catch (_) {}

  try {
    await queryInterface.removeColumn('Invoices', 'transactionRef');
  } catch (_) {}
}
