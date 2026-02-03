import { UserRole } from '../../entities/user.entity';

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    teamId: string | null;
  };
}


