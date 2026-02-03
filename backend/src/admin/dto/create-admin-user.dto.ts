import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../entities/user.entity';

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsEnum(UserRole)
  role: UserRole; // ADMIN | MANAGER | STAFF (MASTER는 수동 관리)

  @Transform(({ value }) => (value === '' || value === undefined ? undefined : value))
  @IsUUID()
  @IsOptional()
  teamId?: string;

  @IsString()
  @MinLength(6)
  initialPassword: string;
}


