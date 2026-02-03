import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole } from '../../entities/user.entity';
import {
  MaskingLevel,
  maskName,
  maskEmail,
  maskPhone,
  maskAmount,
  maskText,
} from '../utils/masking.util';

@Injectable()
export class MaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    return next.handle().pipe(
      map((data) => {
        if (!user) return data;
        return this.applyMasking(data, user);
      }),
    );
  }

  private applyMasking(data: any, user: User): any {
    if (!data) return data;

    // Date 객체를 ISO 문자열로 변환
    if (data instanceof Date) {
      return data.toISOString();
    }

    // 배열인 경우
    if (Array.isArray(data)) {
      return data.map((item) => this.applyMasking(item, user));
    }

    // 객체인 경우
    if (typeof data === 'object' && data !== null) {
      const masked: any = {};

      // 객체의 모든 키를 순회하면서 처리
      for (const key in data) {
        const value = data[key];

        // Date 객체인 경우 ISO 문자열로 변환
        if (value instanceof Date) {
          masked[key] = value.toISOString();
        }
        // 빈 객체이고 Date처럼 보이는 경우 (TypeORM이 직렬화 실패한 경우)
        else if (
          value &&
          typeof value === 'object' &&
          Object.keys(value).length === 0 &&
          (key === 'createdAt' ||
            key === 'updatedAt' ||
            key === 'approvedAt' ||
            key === 'transactionDate' ||
            key === 'expiresAt')
        ) {
          // 빈 객체는 null로 처리 (실제 Date 값이 없는 경우)
          masked[key] = null;
        }
        // 중첩된 객체인 경우 재귀적으로 처리
        else if (typeof value === 'object' && value !== null) {
          masked[key] = this.applyMasking(value, user);
        }
        // 일반 값은 그대로 복사
        else {
          masked[key] = value;
        }
      }

      // Customer 엔티티 마스킹
      // User(요청자/승인자 등)도 email/phone 을 가지고 있기 때문에,
      // createdById 가 존재하는 경우에만 "고객/거래 주체"로 간주하고 마스킹을 적용한다.
      if ((masked.email !== undefined || masked.phone !== undefined) && masked.createdById !== undefined) {
        const level = this.getMaskingLevel(masked, user);
        if (masked.name) masked.name = maskName(masked.name, level);
        if (masked.email) masked.email = maskEmail(masked.email, level);
        if (masked.phone) masked.phone = maskPhone(masked.phone, level);
        if (masked.address) masked.address = maskText(masked.address, level);
        masked.isMasked = level !== MaskingLevel.NONE;
        masked.maskingLevel = level;
      }

      // Transaction 엔티티 마스킹
      if (masked.amount !== undefined) {
        const level = this.getMaskingLevel(masked, user);
        if (masked.amount) {
          masked.amount = maskAmount(masked.amount, masked.currency, level);
        }
        if (masked.contractTerms) {
          masked.contractTerms = maskText(masked.contractTerms, level);
        }
        masked.isMasked = level !== MaskingLevel.NONE;
        masked.maskingLevel = level;
      }

      return masked;
    }

    return data;
  }

  private getMaskingLevel(entity: any, user: User): MaskingLevel {
    // 관리자/마스터는 모든 데이터 열람 가능
    if (user.role === UserRole.ADMIN || user.role === UserRole.MASTER) {
      return MaskingLevel.NONE;
    }

    // 본인이 생성한 데이터는 전체 열람 가능
    if (entity.createdById === user.id) {
      return MaskingLevel.NONE;
    }

    // 같은 팀 데이터는 부분 마스킹
    if (entity.teamId && entity.teamId === user.teamId) {
      // Manager는 팀 데이터 전체 열람 가능
      if (user.role === UserRole.MANAGER) {
        return MaskingLevel.NONE;
      }
      return MaskingLevel.PARTIAL;
    }

    // 타 팀 데이터는 전체 마스킹
    return MaskingLevel.FULL;
  }
}

