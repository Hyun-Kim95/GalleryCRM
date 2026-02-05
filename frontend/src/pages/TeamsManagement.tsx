import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, Team, CreateTeamPayload, UpdateTeamPayload } from '../api/teams.api';
import { formatDate } from '../utils/date';
import { getRoleLabel } from '../utils/role';

export const TeamsManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CreateTeamPayload>({
    name: '',
    description: '',
    isActive: true,
  });
  const [editFormData, setEditFormData] = useState<UpdateTeamPayload>({
    name: undefined,
    description: undefined,
    isActive: undefined,
  });

  const {
    data: teams,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTeamPayload) => teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreateModal(false);
      setFormData({ name: '', description: '', isActive: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamPayload }) => teamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowEditModal(false);
      setEditingTeam(null);
      setEditFormData({ name: undefined, description: undefined, isActive: undefined });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setEditFormData({
      name: team.name,
      description: team.description || undefined,
      isActive: team.isActive,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, data: editFormData });
    }
  };

  const handleToggleActive = (team: Team) => {
    if (window.confirm(`${team.name} 팀의 상태를 ${team.isActive ? '비활성' : '활성'}으로 변경하시겠습니까?`)) {
      updateMutation.mutate({
        id: team.id,
        data: { isActive: !team.isActive },
      });
    }
  };

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">팀 관리</h1>
        <button
          className="button button-primary"
          onClick={() => setShowCreateModal(true)}
        >
          등록
        </button>
      </div>

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
            팀 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </div>
        </div>
      )}

      {teams && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>팀 이름</th>
                  <th>설명</th>
                  <th>상태</th>
                  <th>구성원 수</th>
                  <th>생성일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#95a5a6',
                      }}
                    >
                      팀 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  teams.map((team: Team) => {
                    const isExpanded = expandedTeams.has(team.id);
                    const memberCount = team.users?.length ?? 0;
                    return (
                      <React.Fragment key={team.id}>
                        <tr style={{ backgroundColor: isExpanded ? '#f8f9fa' : 'transparent' }}>
                          <td>
                            {memberCount > 0 && (
                              <button
                                onClick={() => toggleTeamExpansion(team.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '1rem',
                                  padding: '0.25rem',
                                  color: '#3498db',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title={isExpanded ? '접기' : '펼치기'}
                              >
                                {isExpanded ? '▼' : '▶'}
                              </button>
                            )}
                          </td>
                          <td>
                            <strong>{team.name}</strong>
                          </td>
                          <td>{team.description || '-'}</td>
                          <td>
                            <span
                              className={
                                team.isActive ? 'badge badge-success' : 'badge badge-danger'
                              }
                            >
                              {team.isActive ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td>{memberCount}명</td>
                          <td>{formatDate(team.createdAt)}</td>
                          <td>
                            <div className="button-group">
                              <button
                                className="button button-outline"
                                onClick={() => handleEdit(team)}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                              >
                                수정
                              </button>
                              <button
                                className={`button ${team.isActive ? 'button-secondary' : 'button-primary'}`}
                                onClick={() => handleToggleActive(team)}
                                disabled={updateMutation.isPending}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                              >
                                {team.isActive ? '비활성' : '활성'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && team.users && team.users.length > 0 && (
                          <>
                            {team.users.map((user, index) => (
                              <tr
                                key={user.id}
                                style={{
                                  backgroundColor: '#f8f9fa',
                                  borderLeft: '3px solid #3498db',
                                }}
                              >
                                <td></td>
                                <td colSpan={6} style={{ paddingLeft: '1.5rem' }}>
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '16px minmax(0, 1.2fr) minmax(0, 1.8fr) auto',
                                      alignItems: 'center',
                                      columnGap: '0.75rem',
                                      minWidth: 0,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: user.isActive ? '#27ae60' : '#e74c3c',
                                      }}
                                    ></span>
                                    <div
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        alignItems: 'center',
                                        columnGap: '0.4rem',
                                        minWidth: 0,
                                      }}
                                    >
                                      <strong
                                        style={{
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {user.name || user.email}
                                      </strong>
                                      <span
                                        className="badge badge-info"
                                        style={{ fontSize: '0.75rem', justifySelf: 'flex-start' }}
                                      >
                                        {getRoleLabel(user.role)}
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        color: '#7f8c8d',
                                        fontSize: '0.875rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        minWidth: 0,
                                      }}
                                    >
                                      {user.email}
                                    </span>
                                    {!user.isActive && (
                                      <span
                                        className="badge badge-danger"
                                        style={{ fontSize: '0.75rem', justifySelf: 'flex-end' }}
                                      >
                                        비활성
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 팀 등록 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>등록</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  팀 이름 <span style={{ color: '#e74c3c' }}>*</span>
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
                <label className="form-label">설명</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
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

      {/* 팀 수정 모달 */}
      {showEditModal && editingTeam && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>팀 수정</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">
                  팀 이름 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <textarea
                  className="form-textarea"
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="button-group" style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowEditModal(false)}
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
