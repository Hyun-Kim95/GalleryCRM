import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
        team: user.team ? {
          id: user.team.id,
          name: user.team.name,
        } : null,
      },
    };
  }

  async getUserInfo(user: any): Promise<AuthResponseDto> {
    // 사용자 정보를 최신 정보로 가져오기
    const currentUser = await this.usersService.findOneById(user.id);
    if (!currentUser || !currentUser.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      accessToken: '', // me 엔드포인트에서는 토큰을 반환하지 않음
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        teamId: currentUser.teamId,
        team: currentUser.team ? {
          id: currentUser.team.id,
          name: currentUser.team.name,
        } : null,
      },
    };
  }
}




