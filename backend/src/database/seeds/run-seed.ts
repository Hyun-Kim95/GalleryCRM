import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { seedInitialData } from './initial-seed';
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

// 환경 변수 로드 (backend 디렉토리 기준)
config({ path: path.join(__dirname, '../../../.env') });

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'gallery_crm',
    entities: [User, Team, Customer, Artist, Transaction, AccessRequest, AuditLog, EntityHistory, Permission, RolePermission],
    synchronize: false, // 시드 실행 시에는 synchronize 비활성화
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    await seedInitialData(dataSource);

    await dataSource.destroy();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeed();

