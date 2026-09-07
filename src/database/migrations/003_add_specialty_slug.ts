import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '003_add_specialty_slug';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  // 1. Thêm cột slug nếu chưa có
  try {
    await queryInterface.addColumn('Specialties', 'slug', {
      type: DataTypes.STRING(120),
      allowNull: true,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }

  // 2. Tự động sinh slug cho các chuyên khoa đã có trong DB
  try {
    const [specialties]: any = await sequelize.query(`SELECT id, name, slug FROM Specialties;`);
    for (const spec of specialties) {
      if (!spec.slug && spec.name) {
        const genSlug = spec.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
        await sequelize.query(`UPDATE Specialties SET slug = ? WHERE id = ?;`, {
          replacements: [genSlug, spec.id],
        });
      }
    }
  } catch (_) {}
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.removeColumn('Specialties', 'slug');
  } catch (_) {}
}
