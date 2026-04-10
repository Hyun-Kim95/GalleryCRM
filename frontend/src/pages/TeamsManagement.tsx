import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { teamsApi, Team, CreateTeamPayload, UpdateTeamPayload } from '../api/teams.api';
import { formatDate } from '../utils/date';
import { getRoleLabel } from '../utils/role';

export const TeamsManagement: React.FC = () => {
  const { t } = useTranslation();
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
    if (
      window.confirm(
        t('common.confirmToggleTeam', {
          name: team.name,
          next: team.isActive ? t('common.inactive') : t('common.active'),
        })
      )
    ) {
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
        <h1 className="page-title">{t('teams.title')}</h1>
        <button
          className="button button-primary"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          {t('common.register')}
        </button>
      </div>

      {isLoading && (
        <div className="card">
          <p className="ui-empty">{t('common.loading')}</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div className="ui-alert-error">{t('teams.loadError')}</div>
        </div>
      )}

      {teams && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>{t('common.teamName')}</th>
                  <th>{t('common.description')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.members')}</th>
                  <th>{t('common.created')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ui-empty">
                      {t('teams.empty')}
                    </td>
                  </tr>
                ) : (
                  teams.map((team: Team) => {
                    const isExpanded = expandedTeams.has(team.id);
                    const memberCount = team.users?.length ?? 0;
                    return (
                      <React.Fragment key={team.id}>
                        <tr
                          style={{
                            backgroundColor: isExpanded ? 'var(--table-row-hover)' : 'transparent',
                          }}
                        >
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
                                  color: 'var(--link)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title={isExpanded ? t('common.collapse') : t('common.expand')}
                                type="button"
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
                              {team.isActive ? t('common.active') : t('common.inactive')}
                            </span>
                          </td>
                          <td>{t('common.memberCount', { count: memberCount })}</td>
                          <td>{formatDate(team.createdAt)}</td>
                          <td>
                            <div className="button-group">
                              <button
                                className="button button-outline"
                                onClick={() => handleEdit(team)}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                type="button"
                                className={`button ${team.isActive ? 'button-secondary' : 'button-primary'}`}
                                onClick={() => handleToggleActive(team)}
                                disabled={updateMutation.isPending}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                              >
                                {team.isActive ? t('common.inactive') : t('common.active')}
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
                                  backgroundColor: 'var(--table-row-hover)',
                                  borderLeft: '3px solid var(--primary)',
                                }}
                              >
                                <td></td>
                                <td style={{ paddingLeft: '1.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: user.isActive
                                          ? 'var(--indicator-active)'
                                          : 'var(--indicator-inactive)',
                                        flexShrink: 0,
                                      }}
                                    ></span>
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
                                      style={{ fontSize: '0.75rem', flexShrink: 0 }}
                                    >
                                      {getRoleLabel(user.role, t)}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className="ui-text-muted"
                                    style={{
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    {user.email}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={user.isActive ? 'badge badge-success' : 'badge badge-danger'}
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    {user.isActive ? t('common.active') : t('common.inactive')}
                                  </span>
                                </td>
                                <td></td>
                                <td></td>
                                <td></td>
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
            <h2 style={{ marginTop: 0 }}>{t('teams.createTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  {t('common.teamName')} <span className="ui-required">*</span>
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
                <label className="form-label">{t('common.description')}</label>
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

      {/* 팀 수정 모달 */}
      {showEditModal && editingTeam && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{t('teams.editTitle')}</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">
                  {t('common.teamName')} <span className="ui-required">*</span>
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
                <label className="form-label">{t('common.description')}</label>
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
                  {updateMutation.isPending ? t('common.saving') : t('common.save')}
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowEditModal(false)}
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
