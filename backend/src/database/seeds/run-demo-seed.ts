import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { seedInitialData } from './initial-seed';
import { clearBusinessData, seedDemoBusinessData } from './demo-seed';
import {
  User,
  Team,
  Customer,
  Artist,
  Transaction,
  AccessRequest,
  AuditLog,
  EntityHistory,
  Permission,
  RolePermission,
} from '../../entities';

config({ path: path.join(__dirname, '../../../.env') });

async function runDemoSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'gallery_crm',
    entities: [
      User,
      Team,
      Customer,
      Artist,
      Transaction,
      AccessRequest,
      AuditLog,
      EntityHistory,
      Permission,
      RolePermission,
    ],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    await seedInitialData(dataSource);
    await clearBusinessData(dataSource);
    await seedDemoBusinessData(dataSource);

    await dataSource.destroy();
    console.log('✨ Demo seed 완료');
    process.exit(0);
  } catch (error) {
    console.error('❌ Demo seed 오류:', error);
    await dataSource.destroy().catch(() => undefined);
    process.exit(1);
  }
}

runDemoSeed();
