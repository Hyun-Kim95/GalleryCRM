import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, CreateCustomerDto, UpdateCustomerDto } from '../api/customers.api';
import { useAuthStore } from '../store/authStore';

export const CustomerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (customer && isEdit) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    }
  }, [customer, isEdit]);

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerDto) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerDto) => customersApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      navigate(`/customers/${id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '고객 수정' : '등록'}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-container">
          {!isEdit && (
            <div className="form-group" style={{ 
              padding: '0.75rem', 
              backgroundColor: '#e8f4f8', 
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #3498db'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#2c3e50', fontWeight: 500 }}>
                담당 팀: {user?.team?.name || '팀 없음'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                이 고객은 현재 로그인한 사용자의 팀에 자동으로 할당됩니다.
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              이름 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email" className="form-label">이메일</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">전화번호</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">주소</label>
            <input
              id="address"
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">메모</label>
            <textarea
              id="notes"
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={5}
            />
          </div>

          <div className="button-group" style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="button button-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => navigate(isEdit ? `/customers/${id}` : '/customers')}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
