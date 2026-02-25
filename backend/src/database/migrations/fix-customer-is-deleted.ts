import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// 환경 변수 로드
config({ path: path.join(__dirname, '../../../.env') });

async function fixCustomerIsDeleted() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'gallery_crm',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    // 기존 데이터의 is_deleted가 NULL인 경우 false로 업데이트
    const result = await dataSource.query(`
      UPDATE customers 
      SET is_deleted = false 
      WHERE is_deleted IS NULL;
    `);

    console.log(`✅ Updated ${result[1] || 0} customer records (is_deleted: NULL -> false)`);

    await dataSource.destroy();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

fixCustomerIsDeleted();















