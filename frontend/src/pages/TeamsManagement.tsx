import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamsApi, Team, TeamUser, CreateTeamPayload, UpdateTeamPayload } from '../api/teams.api';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/date';

export const TeamsManagement = () => {
  const user = useAuthStore((state) => state.user);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTeamPayload>({
    name: '',
    description: '',
    isActive: true,
  });
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateTeamPayload>({
    name: '',
    description: '',
    isActive: true,
  });

  const queryClient = useQueryClient();

  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateTeamPayload) => teamsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setCreateForm({ name: '', description: '', isActive: true });
      setIsCreateOpen(false);
      alert('팀이 생성되었습니다.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? '팀 생성 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; payload: UpdateTeamPayload }) =>
      teamsApi.update(params.id, params.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setEditingTeamId(null);
      alert('팀 정보가 수정되었습니다.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? '팀 수정 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'MASTER':
        return '마스터';
      case 'ADMIN':
        return '관리자';
      case 'MANAGER':
        return '팀장';
      case 'STAFF':
        return '팀원';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MASTER':
        return '#9b59b6';
      case 'ADMIN':
        return '#3498db';
      case 'MANAGER':
        return '#f39c12';
      case 'STAFF':
        return '#95a5a6';
      default:
        return '#34495e';
    }
  };

  const isAdminLike = user?.role === 'ADMIN' || user?.role === 'MASTER';

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>;
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#e74c3c', color: 'white', padding: '15px', borderRadius: '4px' }}>
        팀 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>팀 관리</h1>
        <p style={{ color: '#7f8c8d', marginTop: '4px' }}>
          {isAdminLike
            ? '모든 팀의 구성원을 확인하고, 팀 생성/수정이 가능합니다.'
            : '본인 팀의 구성원을 확인할 수 있습니다.'}
        </p>

        {isAdminLike && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => setIsCreateOpen((prev) => !prev)}
              style={{
                padding: '8px 16px',
                backgroundColor: isCreateOpen ? '#7f8c8d' : '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {isCreateOpen ? '새 팀 생성 닫기' : '새 팀 생성'}
            </button>
          </div>
        )}
      </div>

      {isAdminLike && isCreateOpen && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>새 팀 생성</h2>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#7f8c8d',
                }}
              >
                팀 이름
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: '1px solid #bdc3c7',
                  fontSize: '14px',
                }}
                placeholder="예) VIP 고객 관리팀"
              />
            </div>
            <div style={{ flex: 2 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#7f8c8d',
                }}
              >
                설명
              </label>
              <input
                type="text"
                value={createForm.description ?? ''}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: '1px solid #bdc3c7',
                  fontSize: '14px',
                }}
                placeholder="팀에 대한 간단한 설명을 입력하세요."
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={!!createForm.isActive}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
              />
              활성 팀
            </label>
            <button
              onClick={() => {
                if (!createForm.name.trim()) {
                  alert('팀 이름을 입력하세요.');
                  return;
                }
                createMutation.mutate({
                  name: createForm.name.trim(),
                  description: createForm.description?.trim() || undefined,
                  isActive: createForm.isActive,
                });
              }}
              disabled={createMutation.isPending}
              style={{
                padding: '8px 18px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              {createMutation.isPending ? '생성 중...' : '생성'}
            </button>
          </div>
        </div>
      )}

      {teams && teams.length === 0 ? (
        <div
          style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#95a5a6',
          }}
        >
          팀 데이터가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {teams?.map((team) => {
            const isExpanded = expandedTeams.has(team.id);
            const managers = team.users?.filter((u) => u.role === 'MANAGER') || [];
            const staff = team.users?.filter((u) => u.role === 'STAFF') || [];
            const admins = team.users?.filter((u) => u.role === 'ADMIN' || u.role === 'MASTER') || [];

            const isEditing = editingTeamId === team.id;

            return (
              <div
                key={team.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                {/* 팀 헤더 */}
                <div
                  style={{
                    padding: '20px',
                    borderBottom: isExpanded ? '1px solid #ecf0f1' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onClick={() => toggleTeam(team.id)}
                >
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#2c3e50' }}>{team.name}</h2>
                    {team.description && (
                      <p style={{ margin: '8px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
                        {team.description}
                      </p>
                    )}
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#95a5a6' }}>
                      총 {team.users?.length || 0}명
                      {managers.length > 0 && ` · 팀장 ${managers.length}명`}
                      {staff.length > 0 && ` · 팀원 ${staff.length}명`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isAdminLike && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTeamId(isEditing ? null : team.id);
                          setEditForm({
                            name: team.name,
                            description: team.description ?? '',
                            isActive: team.isActive,
                          });
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {isEditing ? '편집 취소' : '팀 정보 편집'}
                      </button>
                    )}
                    <div style={{ fontSize: '24px', color: '#95a5a6' }}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {/* 팀 정보 편집 영역 */}
                {isAdminLike && isEditing && (
                  <div
                    style={{
                      padding: '16px 20px 4px 20px',
                      borderTop: '1px solid #ecf0f1',
                      backgroundColor: '#fdfefe',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: '#7f8c8d',
                          }}
                        >
                          팀 이름
                        </label>
                        <input
                          type="text"
                          value={editForm.name ?? ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '4px',
                            border: '1px solid #bdc3c7',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                      <div style={{ flex: 2 }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: '#7f8c8d',
                          }}
                        >
                          설명
                        </label>
                        <input
                          type="text"
                          value={editForm.description ?? ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '4px',
                            border: '1px solid #bdc3c7',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <label
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                      >
                        <input
                          type="checkbox"
                          checked={!!editForm.isActive}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              isActive: e.target.checked,
                            }))
                          }
                        />
                        활성 팀
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setEditingTeamId(null)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#bdc3c7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          취소
                        </button>
                        <button
                          onClick={() => {
                            if (!editForm.name?.trim()) {
                              alert('팀 이름을 입력하세요.');
                              return;
                            }
                            updateMutation.mutate({
                              id: team.id,
                              payload: {
                                name: editForm.name.trim(),
                                description: editForm.description?.trim() || undefined,
                                isActive: editForm.isActive,
                              },
                            });
                          }}
                          disabled={updateMutation.isPending}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {updateMutation.isPending ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 팀원 목록 (트리 구조) */}
                {isExpanded && (
                  <div style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
                    {/* 관리자/마스터 */}
                    {admins.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#7f8c8d',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #ecf0f1',
                          }}
                        >
                          관리자
                        </div>
                        {admins.map((admin) => (
                          <div
                            key={admin.id}
                            style={{
                              padding: '12px',
                              marginLeft: '20px',
                              marginBottom: '8px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: getRoleColor(admin.role),
                                    color: 'white',
                                  }}
                                >
                                  {getRoleLabel(admin.role)}
                                </span>
                                <span style={{ fontWeight: 'bold' }}>{admin.name}</span>
                                {!admin.isActive && (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: '#e74c3c',
                                      padding: '2px 8px',
                                      backgroundColor: '#ffeaa7',
                                      borderRadius: '3px',
                                    }}
                                  >
                                    비활성화
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '4px' }}>
                                {admin.email}
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                              {formatDate(admin.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 팀장 */}
                    {managers.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#7f8c8d',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #ecf0f1',
                          }}
                        >
                          팀장
                        </div>
                        {managers.map((manager) => (
                          <div
                            key={manager.id}
                            style={{
                              padding: '12px',
                              marginLeft: '20px',
                              marginBottom: '8px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: getRoleColor(manager.role),
                                    color: 'white',
                                  }}
                                >
                                  {getRoleLabel(manager.role)}
                                </span>
                                <span style={{ fontWeight: 'bold' }}>{manager.name}</span>
                                {!manager.isActive && (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: '#e74c3c',
                                      padding: '2px 8px',
                                      backgroundColor: '#ffeaa7',
                                      borderRadius: '3px',
                                    }}
                                  >
                                    비활성화
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '4px' }}>
                                {manager.email}
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                              {formatDate(manager.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 팀원 */}
                    {staff.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#7f8c8d',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #ecf0f1',
                          }}
                        >
                          팀원
                        </div>
                        {staff.map((member) => (
                          <div
                            key={member.id}
                            style={{
                              padding: '12px',
                              marginLeft: '20px',
                              marginBottom: '8px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: getRoleColor(member.role),
                                    color: 'white',
                                  }}
                                >
                                  {getRoleLabel(member.role)}
                                </span>
                                <span style={{ fontWeight: 'bold' }}>{member.name}</span>
                                {!member.isActive && (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: '#e74c3c',
                                      padding: '2px 8px',
                                      backgroundColor: '#ffeaa7',
                                      borderRadius: '3px',
                                    }}
                                  >
                                    비활성화
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '4px' }}>
                                {member.email}
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                              {formatDate(member.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!admins.length && !managers.length && !staff.length) && (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>
                        팀원이 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

