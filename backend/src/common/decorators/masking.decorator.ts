import { UseInterceptors } from '@nestjs/common';
import { MaskingInterceptor } from '../interceptors/masking.interceptor';

/**
 * 데이터 마스킹 인터셉터 적용 데코레이터
 * 컨트롤러 메서드에 적용하여 응답 데이터 자동 마스킹
 */
export const UseMasking = () => UseInterceptors(MaskingInterceptor);




