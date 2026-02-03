import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
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
} from './entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccessRequestsModule } from './access-requests/access-requests.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CustomersModule } from './customers/customers.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ArtistsModule } from './artists/artists.module';
import { TeamsModule } from './teams/teams.module';
import { EntityHistoryModule } from './entity-history/entity-history.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { RbacModule } from './rbac/rbac.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    // 스케줄러 모듈 (정기 정리 작업용)
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
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
    ]),
    AuthModule,
    UsersModule,
    AccessRequestsModule,
    AuditLogsModule,
    CustomersModule,
    TransactionsModule,
    ArtistsModule,
    TeamsModule,
    EntityHistoryModule,
    RbacModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
