import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, CreateCustomerDto, UpdateCustomerDto } from '../api/customers.api';
import { useAuthStore } from '../store/authStore';

export const CustomerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isEdit = !!id;

  // 고객 상세 조회 (수정 모드일 때)
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
    enabled: isEdit && !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCustomerDto>({
    defaultValues: {},
  });

  // 수정 모드일 때 폼 데이터 채우기
  useEffect(() => {
    if (customer && isEdit) {
      reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    }
  }, [customer, isEdit, reset]);

  // 생성/수정 Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerDto) => customersApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate(`/customers/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerDto) => customersApi.update(id!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      navigate(`/customers/${data.id}`);
    },
  });

  const onSubmit = (data: CreateCustomerDto | UpdateCustomerDto) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data as CreateCustomerDto);
    }
  };

  if (isLoadingCustomer) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>;
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <Link to={isEdit ? `/customers/${id}` : '/customers'} style={{ color: '#3498db', textDecoration: 'none' }}>
          ← {isEdit ? '상세로 돌아가기' : '목록으로 돌아가기'}
        </Link>
        <h1 style={{ margin: '10px 0 0 0' }}>{isEdit ? '고객 수정' : '새 고객 등록'}</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              이름 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: '이름을 입력해주세요' })}
              style={{
                width: '100%',
                padding: '10px',
                border: errors.name ? '2px solid #e74c3c' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
            {errors.name && (
              <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>{errors.name.message}</div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이메일</label>
            <input
              type="email"
              {...register('email')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>전화번호</label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="010-1234-5678"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>주소</label>
            <input
              type="text"
              {...register('address')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>메모</label>
            <textarea
              {...register('notes')}
              rows={5}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
};

