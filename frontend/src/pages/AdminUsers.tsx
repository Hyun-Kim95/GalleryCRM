import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminUsersApi,
  AdminUser,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from '../api/admin-users.api';
import { teamsApi } from '../api/teams.api';
import { useAuthStore } from '../store/authStore';
import { getRoleLabel } from '../utils/role';

type Mode = 'list' | 'create' | 'edit';

export const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('list');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const currentUser = useAuthStore((state) => state.user);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminUsersApi.getAll(),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAdminUserDto) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('사용자가 생성되었습니다.');
      setMode('list');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || '사용자 생성 중 오류가 발생했습니다.';
      alert(Array.isArray(message) ? message.join('\n') : message);
      console.error('사용자 생성 에러:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUserDto }) =>
      adminUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('사용자 정보가 수정되었습니다.');
      setMode('list');
      setSelectedUser(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      adminUsersApi.resetPassword(id, { newPassword }),
    onSuccess: () => {
      alert('비밀번호가 초기화되었습니다.');
    },
  });

  const [createForm, setCreateForm] = useState<CreateAdminUserDto>({
    email: '',
    name: '',
    role: 'STAFF',
    teamId: undefined,
    initialPassword: '',
  });

  const [editForm, setEditForm] = useState<UpdateAdminUserDto>({
    role: undefined,
    teamId: undefined,
    isActive: undefined,
  });

  const openCreate = () => {
    setCreateForm({
      email: '',
      name: '',
      role: 'STAFF',
      // 팀장인 경우 자동으로 본인 팀 선택
      teamId: currentUser?.role === 'MANAGER' ? currentUser.teamId || undefined : undefined,
      initialPassword: '',
    });
    setMode('create');
    setSelectedUser(null);
  };

  const renderCreate = () => (
    <div>
      <h1 style={{ marginBottom: '20px' }}>사용자 생성</h1>
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          maxWidth: '600px',
        }}
      >
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이메일</label>
          <input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이름</label>
          <input
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>역할</label>
          <select
            value={createForm.role}
            onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="ADMIN">관리자</option>
            <option value="MANAGER">팀장</option>
            <option value="STAFF">사원</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>팀</label>
          <select
            value={createForm.teamId || ''}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, teamId: e.target.value || undefined }))
            }
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
            disabled={currentUser?.role === 'MANAGER'}
          >
            <option value="">선택 안 함</option>
            {teams
              ?.filter((t) =>
                currentUser?.role === 'MANAGER' && currentUser.teamId
                  ? t.id === currentUser.teamId
                  : true,
              )
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
          {currentUser?.role === 'MANAGER' && (
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
              팀장은 본인 소속 팀으로만 사원을 등록할 수 있습니다.
            </div>
          )}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            초기 비밀번호 <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <input
            type="password"
            value={createForm.initialPassword}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, initialPassword: e.target.value }))
            }
            minLength={6}
            placeholder="최소 6자 이상 입력하세요"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
          {createForm.initialPassword && createForm.initialPassword.length < 6 && (
            <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>
              비밀번호는 최소 6자 이상이어야 합니다.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              setMode('list');
              setSelectedUser(null);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7f8c8d';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#95a5a6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              // 유효성 검사
              if (!createForm.email) {
                alert('이메일을 입력해주세요.');
                return;
              }
              if (!createForm.name) {
                alert('이름을 입력해주세요.');
                return;
              }
              if (!createForm.initialPassword) {
                alert('초기 비밀번호를 입력해주세요.');
                return;
              }
              if (createForm.initialPassword.length < 6) {
                alert('비밀번호는 최소 6자 이상이어야 합니다.');
                return;
              }

              const payload = { ...createForm };
              // teamId가 undefined이면 제거
              if (!payload.teamId) {
                delete payload.teamId;
              }
              console.log('사용자 생성 요청 데이터:', payload);
              createMutation.mutate(payload);
            }}
            disabled={createMutation.isPending}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!createMutation.isPending) {
                e.currentTarget.style.backgroundColor = '#2980b9';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!createMutation.isPending) {
                e.currentTarget.style.backgroundColor = '#3498db';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {createMutation.isPending ? '생성 중...' : '생성'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderEdit = () => {
    if (!selectedUser) return null;
    const isEditingSelf = currentUser?.id === selectedUser.id && currentUser?.role === 'ADMIN';
    return (
      <div>
        <h1 style={{ marginBottom: '20px' }}>사용자 수정</h1>
        <div
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '600px',
          }}
        >
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이메일</label>
            <div>{selectedUser.email}</div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이름</label>
            <div>{selectedUser.name}</div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>역할</label>
            <select
              value={editForm.role || ''}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  role: e.target.value || undefined,
                }))
              }
              disabled={isEditingSelf}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                backgroundColor: isEditingSelf ? '#f5f5f5' : 'white',
                cursor: isEditingSelf ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">변경 안 함</option>
              <option value="ADMIN">관리자</option>
              <option value="MANAGER">팀장</option>
              <option value="STAFF">사원</option>
            </select>
            {isEditingSelf && (
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
                본인의 역할은 변경할 수 없습니다.
              </div>
            )}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>팀</label>
            <select
              value={editForm.teamId || ''}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  teamId: e.target.value || undefined,
                }))
              }
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">변경 안 함</option>
              {teams?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>상태</label>
            <select
              value={editForm.isActive === undefined ? '' : editForm.isActive ? '1' : '0'}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  isActive: e.target.value === '' ? undefined : e.target.value === '1',
                }))
              }
              disabled={isEditingSelf}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                backgroundColor: isEditingSelf ? '#f5f5f5' : 'white',
                cursor: isEditingSelf ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">변경 안 함</option>
              <option value="1">활성</option>
              <option value="0">비활성</option>
            </select>
            {isEditingSelf && (
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
                본인의 활성화 상태는 변경할 수 없습니다.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setMode('list');
                setSelectedUser(null);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7f8c8d';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#95a5a6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={() =>
                updateMutation.mutate({
                  id: selectedUser.id,
                  data: editForm,
                })
              }
              disabled={updateMutation.isPending}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!updateMutation.isPending) {
                  e.currentTarget.style.backgroundColor = '#2980b9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!updateMutation.isPending) {
                  e.currentTarget.style.backgroundColor = '#3498db';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const openEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      teamId: user.teamId || undefined,
      isActive: user.isActive,
    });
    setMode('edit');
  };


  const renderList = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>사용자 관리</h1>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2980b9';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3498db';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          + 사용자 생성
        </button>
      </div>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>}
      {error && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: '#e74c3c',
            color: 'white',
          }}
        >
          사용자 목록을 불러오는 중 오류가 발생했습니다.
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            {error instanceof Error ? error.message : String(error)}
          </div>
        </div>
      )}

      {users && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>이메일</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>역할</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>팀</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>상태</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                    사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>{user.name}</td>
                    <td style={{ padding: '12px' }}>{getRoleLabel(user.role)}</td>
                    <td style={{ padding: '12px' }}>{user.team?.name || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: user.isActive ? '#27ae60' : '#95a5a6',
                          color: 'white',
                        }}
                      >
                        {user.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {user.role !== 'ADMIN' && user.role !== 'MASTER' && (
                        <button
                          onClick={() => openEdit(user)}
                          style={{
                            padding: '6px 12px',
                            marginRight: '8px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2980b9';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3498db';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          수정
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const pw = prompt('새 비밀번호를 입력하세요:');
                          if (!pw) return;
                          resetPasswordMutation.mutate({ id: user.id, newPassword: pw });
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#e67e22',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#d35400';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#e67e22';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        비밀번호 초기화
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (mode === 'create') return renderCreate();
  if (mode === 'edit') return renderEdit();
  return renderList();
};
