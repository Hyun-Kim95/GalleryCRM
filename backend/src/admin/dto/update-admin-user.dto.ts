import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UpdateAdminUserDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsUUID()
  @IsOptional()
  teamId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}



