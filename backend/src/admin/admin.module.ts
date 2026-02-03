import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacModule } from '../rbac/rbac.module';
import { AdminRolesController } from './admin-roles.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { User } from '../entities/user.entity';
import { Team } from '../entities/team.entity';

@Module({
  imports: [RbacModule, TypeOrmModule.forFeature([User, Team])],
  controllers: [AdminRolesController, AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminModule {}

