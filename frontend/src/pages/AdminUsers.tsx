import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminUsersApi, AdminUser, CreateAdminUserDto, UpdateAdminUserDto } from '../api/admin-users.api';
import { getRoleLabel } from '../utils/role';
import { formatDate } from '../utils/date';
import { teamsApi } from '../api/teams.api';
import { useAuthStore } from '../store/authStore';

export const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isManager = currentUser?.role === 'MANAGER';
  const isAdmin = currentUser?.role === 'MASTER' || currentUser?.role === 'ADMIN';
  const isStaff = currentUser?.role === 'STAFF';
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState<CreateAdminUserDto>({
    email: '',
    name: '',
    role: 'STAFF',
    initialPassword: '',
    teamId: isManager ? currentUser?.teamId || undefined : undefined,
  });
  const [editFormData, setEditFormData] = useState<UpdateAdminUserDto>({
    role: undefined,
    teamId: undefined,
    isActive: undefined,
  });

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminUsersApi.getAll(),
  });

  // 권한에 따라 필터링
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    // 사원은 본인 계정만
    if (isStaff && currentUser?.id) {
      return users.filter((user: AdminUser) => user.id === currentUser.id);
    }
    // 팀장은 본인 팀원만
    if (isManager && currentUser?.teamId) {
      return users.filter((user: AdminUser) => user.teamId === currentUser.teamId);
    }
    // 관리자는 전체
    return users;
  }, [users, isManager, isStaff, currentUser?.teamId, currentUser?.id]);

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  // 팀장인 경우 본인 팀만 선택 가능
  const availableTeams = useMemo(() => {
    if (!teams) return [];
    if (isManager && currentUser?.teamId) {
      return teams.filter((team) => team.id === currentUser.teamId);
    }
    return teams;
  }, [teams, isManager, currentUser?.teamId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateAdminUserDto) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateModal(false);
      setFormData({ 
        email: '', 
        name: '', 
        role: 'STAFF', 
        initialPassword: '',
        teamId: isManager ? currentUser?.teamId || undefined : undefined,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUserDto }) => adminUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({ role: undefined, teamId: undefined, isActive: undefined });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => adminUsersApi.resetPassword(id, { newPassword: password }),
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordUser(null);
      setNewPassword('');
      alert(t('common.passwordResetDone'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditFormData({
      role: user.role,
      teamId: user.teamId || undefined,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: editFormData });
    }
  };

  const handlePasswordReset = (user: AdminUser) => {
    setPasswordUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordUser && newPassword) {
      resetPasswordMutation.mutate({ id: passwordUser.id, password: newPassword });
    }
  };

  const handleToggleActive = (user: AdminUser) => {
    // 본인 계정은 활성/비활성 변경 불가
    if (user.id === currentUser?.id) {
      alert(t('common.cannotToggleSelf'));
      return;
    }
    if (
      window.confirm(
        t('common.confirmToggleUser', {
          name: user.name,
          next: user.isActive ? t('common.inactive') : t('common.active'),
        })
      )
    ) {
      updateMutation.mutate({
        id: user.id,
        data: { isActive: !user.isActive },
      });
    }
  };

  const isEditingSelf = editingUser?.id === currentUser?.id;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('adminUsers.title')}</h1>
        {(isAdmin || isManager) && (
          <button
            type="button"
            className="button button-primary"
            onClick={() => setShowCreateModal(true)}
          >
            {t('common.register')}
          </button>
        )}
      </div>

      {isStaff && (
        <div className="ui-callout-info" style={{ marginBottom: '1rem' }}>
          {t('adminUsers.staffBanner')}
        </div>
      )}

      {isLoading && (
        <div className="card">
          <p className="ui-empty">{t('common.loading')}</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div className="ui-alert-error">{t('adminUsers.loadError')}</div>
        </div>
      )}

      {filteredUsers && (
        <div className="card">
          {isManager && (
            <div className="ui-callout-info" style={{ marginBottom: '1rem' }}>
              {t('adminUsers.managerBanner', { count: filteredUsers.length })}
            </div>
          )}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>{t('common.email')}</th>
                  <th>{t('common.role')}</th>
                  <th>{t('common.team')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.createdAtCol')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ui-empty">
                      {isManager ? t('adminUsers.emptyStaff') : t('adminUsers.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user: AdminUser) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{getRoleLabel(user.role, t)}</td>
                      <td>{user.team?.name || '-'}</td>
                      <td>
                        <span
                          className={
                            user.isActive ? 'badge badge-success' : 'badge badge-danger'
                          }
                        >
                          {user.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="button-group">
                          {!isStaff && (
                            <button
                              type="button"
                              className="button button-outline"
                              onClick={() => handleEdit(user)}
                              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                            >
                              {t('common.edit')}
                            </button>
                          )}
                          <button
                            type="button"
                            className="button button-outline"
                            onClick={() => handlePasswordReset(user)}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                          >
                            {t('common.password')}
                          </button>
                          {!isStaff && user.id !== currentUser?.id && (
                            <button
                              type="button"
                              className={`button ${user.isActive ? 'button-secondary' : 'button-primary'}`}
                              onClick={() => handleToggleActive(user)}
                              disabled={updateMutation.isPending}
                              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                            >
                              {user.isActive ? t('common.inactive') : t('common.active')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 사용자 등록 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{t('teams.createTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  {t('login.email')} <span className="ui-required">*</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t('common.name')} <span className="ui-required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t('common.role')} <span className="ui-required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      teamId: newRole === 'ADMIN' ? undefined : prev.teamId,
                    }));
                  }}
                  required
                  disabled={isManager}
                >
                  <option value="STAFF">{t('userRoleOption.STAFF')}</option>
                  {!isManager && <option value="MANAGER">{t('userRoleOption.MANAGER')}</option>}
                  {isAdmin && <option value="ADMIN">{t('userRoleOption.ADMIN')}</option>}
                </select>
                {isManager && (
                  <p className="ui-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {t('adminUsers.managerStaffOnly')}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{t('common.team')}</label>
                <select
                  className="form-select"
                  value={formData.teamId || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, teamId: e.target.value || undefined }))}
                  disabled={isManager || formData.role === 'ADMIN'}
                >
                  {!isManager && <option value="">{t('adminUsers.noTeamOption')}</option>}
                  {availableTeams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {isManager && (
                  <p className="ui-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {t('adminUsers.managerTeamOnly')}
                  </p>
                )}
                {formData.role === 'ADMIN' && (
                  <p className="ui-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {t('adminUsers.adminNoTeam')}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t('common.initialPassword')} <span className="ui-required">*</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.initialPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, initialPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="button-group" style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? t('common.registering') : t('common.register')}
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 사용자 수정 모달 */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{t('teams.editTitle')}</h2>
            {isEditingSelf && (
              <div className="ui-callout-warning" style={{ marginBottom: '1rem', padding: '0.75rem', fontSize: '0.875rem' }}>
                {t('adminUsers.editSelfPasswordOnly')}
              </div>
            )}
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">{t('common.name')}</label>
                <div className="ui-field">{editingUser.name}</div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('login.email')}</label>
                <div className="ui-field">{editingUser.email}</div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t('common.role')} <span className="ui-required">*</span>
                </label>
                <select
                  className="form-select"
                  value={editFormData.role || ''}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setEditFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      // 관리자 역할 선택 시 팀 자동 제거
                      teamId: newRole === 'ADMIN' ? undefined : prev.teamId,
                    }));
                  }}
                  required
                  disabled={isManager || isEditingSelf}
                >
                  <option value="STAFF">{t('userRoleOption.STAFF')}</option>
                  {!isManager && <option value="MANAGER">{t('userRoleOption.MANAGER')}</option>}
                  {isAdmin && <option value="ADMIN">{t('userRoleOption.ADMIN')}</option>}
                </select>
                {(isManager || isEditingSelf) && (
                  <p className="ui-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {isEditingSelf ? t('adminUsers.cannotChangeRoleSelf') : t('adminUsers.cannotChangeRoleManager')}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{t('common.team')}</label>
                <select
                  className="form-select"
                  value={editFormData.teamId || ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, teamId: e.target.value || undefined }))}
                  disabled={isManager || isEditingSelf || editFormData.role === 'ADMIN'}
                >
                  {!isManager && <option value="">{t('adminUsers.noTeamOption')}</option>}
                  {availableTeams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {(isManager || isEditingSelf) && (
                  <p className="ui-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {isEditingSelf ? t('adminUsers.cannotChangeTeamSelf') : t('adminUsers.cannotChangeTeamManager')}
                  </p>
                )}
                {editFormData.role === 'ADMIN' && !isEditingSelf && (
                  <p className="ui-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {t('adminUsers.adminNoTeam')}
                  </p>
                )}
              </div>
              {isEditingSelf && (
                <div className="ui-callout-info" style={{ marginTop: '1rem' }}>
                  {t('adminUsers.passwordHintSelf')}
                </div>
              )}
              <div className="button-group" style={{ marginTop: '1.5rem' }}>
                {!isEditingSelf && (
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? t('common.saving') : t('common.save')}
                  </button>
                )}
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                >
                  {isEditingSelf ? t('common.close') : t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비밀번호 재설정 모달 */}
      {showPasswordModal && passwordUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{t('common.passwordResetTitle')}</h2>
            <p className="ui-text-muted" style={{ marginBottom: '1rem' }}>
              {t('common.passwordResetDesc', { name: passwordUser.name })}
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">
                  {t('common.newPassword')} <span className="ui-required">*</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="button-group" style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? t('common.resetting') : t('common.resetPassword')}
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
