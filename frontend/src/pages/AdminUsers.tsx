import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi, AdminUser, CreateAdminUserDto, UpdateAdminUserDto } from '../api/admin-users.api';
import { getRoleLabel } from '../utils/role';
import { formatDate } from '../utils/date';
import { teamsApi } from '../api/teams.api';
import { useAuthStore } from '../store/authStore';

export const AdminUsers: React.FC = () => {
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
      alert('비밀번호가 재설정되었습니다.');
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
      alert('본인 계정의 활성 상태는 변경할 수 없습니다.');
      return;
    }
    if (window.confirm(`${user.name} 사용자의 상태를 ${user.isActive ? '비활성' : '활성'}으로 변경하시겠습니까?`)) {
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
        <h1 className="page-title">사용자 관리</h1>
        {(isAdmin || isManager) && (
          <button
            className="button button-primary"
            onClick={() => setShowCreateModal(true)}
          >
            등록
          </button>
        )}
      </div>

      {isStaff && (
        <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#e8f4f8', borderRadius: '4px', fontSize: '0.875rem' }}>
          본인 계정 정보만 표시됩니다. 비밀번호를 변경할 수 있습니다.
        </div>
      )}

      {isLoading && (
        <div className="card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div
            style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '1rem',
              borderRadius: '4px',
            }}
          >
            사용자 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </div>
        </div>
      )}

      {filteredUsers && (
        <div className="card">
          {isManager && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#e8f4f8', borderRadius: '4px', fontSize: '0.875rem' }}>
              본인 팀원만 표시됩니다. (총 {filteredUsers.length}명)
            </div>
          )}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>역할</th>
                  <th>팀</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#95a5a6',
                      }}
                    >
                      {isManager ? '본인 팀원이 없습니다.' : '사용자 데이터가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user: AdminUser) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{getRoleLabel(user.role)}</td>
                      <td>{user.team?.name || '-'}</td>
                      <td>
                        <span
                          className={
                            user.isActive ? 'badge badge-success' : 'badge badge-danger'
                          }
                        >
                          {user.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="button-group">
                          {/* 사원은 본인 계정만 보이므로 수정 버튼 숨김 (비밀번호만 변경 가능) */}
                          {!isStaff && (
                            <button
                              className="button button-outline"
                              onClick={() => handleEdit(user)}
                              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                            >
                              수정
                            </button>
                          )}
                          <button
                            className="button button-outline"
                            onClick={() => handlePasswordReset(user)}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                          >
                            비밀번호
                          </button>
                          {/* 사원은 활성/비활성 버튼 숨김 */}
                          {!isStaff && user.id !== currentUser?.id && (
                            <button
                              className={`button ${user.isActive ? 'button-secondary' : 'button-primary'}`}
                              onClick={() => handleToggleActive(user)}
                              disabled={updateMutation.isPending}
                              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                            >
                              {user.isActive ? '비활성' : '활성'}
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
            <h2 style={{ marginTop: 0 }}>등록</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  이메일 <span style={{ color: '#e74c3c' }}>*</span>
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
                  이름 <span style={{ color: '#e74c3c' }}>*</span>
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
                  역할 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      // 관리자 역할 선택 시 팀 자동 제거
                      teamId: newRole === 'ADMIN' ? undefined : prev.teamId,
                    }));
                  }}
                  required
                  disabled={isManager}
                >
                  <option value="STAFF">사원</option>
                  {!isManager && <option value="MANAGER">팀장</option>}
                  {isAdmin && <option value="ADMIN">관리자</option>}
                </select>
                {isManager && (
                  <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                    팀장은 사원만 등록할 수 있습니다.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  팀
                </label>
                <select
                  className="form-select"
                  value={formData.teamId || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, teamId: e.target.value || undefined }))}
                  disabled={isManager || formData.role === 'ADMIN'}
                >
                  {!isManager && <option value="">팀 없음</option>}
                  {availableTeams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {isManager && (
                  <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                    본인 팀에만 등록됩니다.
                  </p>
                )}
                {formData.role === 'ADMIN' && (
                  <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                    관리자는 팀 없음으로 고정됩니다.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  초기 비밀번호 <span style={{ color: '#e74c3c' }}>*</span>
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
                  {createMutation.isPending ? '등록 중...' : '등록'}
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  취소
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
            <h2 style={{ marginTop: 0 }}>사용자 수정</h2>
            {isEditingSelf && (
              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#fff3cd', 
                borderRadius: '4px', 
                fontSize: '0.875rem',
                color: '#856404'
              }}>
                본인 계정은 비밀번호만 수정할 수 있습니다. 역할, 팀, 활성 상태는 변경할 수 없습니다.
              </div>
            )}
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">이름</label>
                <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {editingUser.name}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">이메일</label>
                <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {editingUser.email}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  역할 <span style={{ color: '#e74c3c' }}>*</span>
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
                  <option value="STAFF">사원</option>
                  {!isManager && <option value="MANAGER">팀장</option>}
                  {isAdmin && <option value="ADMIN">관리자</option>}
                </select>
                {(isManager || isEditingSelf) && (
                  <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                    {isEditingSelf ? '본인 계정의 역할은 변경할 수 없습니다.' : '팀장은 역할을 변경할 수 없습니다.'}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">팀</label>
                <select
                  className="form-select"
                  value={editFormData.teamId || ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, teamId: e.target.value || undefined }))}
                  disabled={isManager || isEditingSelf || editFormData.role === 'ADMIN'}
                >
                  {!isManager && <option value="">팀 없음</option>}
                  {availableTeams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {(isManager || isEditingSelf) && (
                  <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                    {isEditingSelf ? '본인 계정의 팀은 변경할 수 없습니다.' : '팀장은 팀을 변경할 수 없습니다.'}
                  </p>
                )}
                {editFormData.role === 'ADMIN' && !isEditingSelf && (
                  <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                    관리자는 팀 없음으로 고정됩니다.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isEditingSelf ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editFormData.isActive ?? true}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    disabled={isEditingSelf}
                  />
                  활성 상태
                </label>
                {isEditingSelf && (
                  <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                    본인 계정의 활성 상태는 변경할 수 없습니다.
                  </p>
                )}
              </div>
              {isEditingSelf && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#e8f4f8', 
                  borderRadius: '4px', 
                  fontSize: '0.875rem' 
                }}>
                  비밀번호를 변경하려면 "비밀번호" 버튼을 사용하세요.
                </div>
              )}
              <div className="button-group" style={{ marginTop: '1.5rem' }}>
                {!isEditingSelf && (
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? '저장 중...' : '저장'}
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
                  {isEditingSelf ? '닫기' : '취소'}
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
            <h2 style={{ marginTop: 0 }}>비밀번호 재설정</h2>
            <p style={{ marginBottom: '1rem', color: '#7f8c8d' }}>
              {passwordUser.name} 사용자의 비밀번호를 재설정합니다.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">
                  새 비밀번호 <span style={{ color: '#e74c3c' }}>*</span>
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
                  {resetPasswordMutation.isPending ? '재설정 중...' : '재설정'}
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
