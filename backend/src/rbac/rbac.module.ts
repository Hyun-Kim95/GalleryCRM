import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { RbacService } from './rbac.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission])],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}





