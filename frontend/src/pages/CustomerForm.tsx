import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { customersApi, CreateCustomerDto, UpdateCustomerDto } from '../api/customers.api';
import { useAuthStore } from '../store/authStore';

export const CustomerForm: React.FC = () => {
  const { t } = useTranslation();
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
        <h1 className="page-title">{isEdit ? t('customers.editTitle') : t('customers.newTitle')}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-container">
          {!isEdit && (
            <div className="form-group ui-callout-info" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 500 }}>
                {t('customers.teamHint', { team: user?.team?.name || t('common.noTeam') })}
              </div>
              <div className="ui-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {t('customers.teamAutoAssign')}
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              {t('common.name')} <span className="ui-required">*</span>
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
              <label htmlFor="email" className="form-label">
                {t('common.email')}
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                {t('common.phone')}
              </label>
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
            <label htmlFor="address" className="form-label">
              {t('common.address')}
            </label>
            <input
              id="address"
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              {t('common.notes')}
            </label>
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
              {createMutation.isPending || updateMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => navigate(isEdit ? `/customers/${id}` : '/customers')}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
