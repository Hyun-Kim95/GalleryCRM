import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { artistsApi, CreateArtistDto, UpdateArtistDto } from '../api/artists.api';

export const ArtistForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateArtistDto>({
    name: '',
    nationality: '',
    genre: '',
    bio: '',
  });

  const { data: artist } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistsApi.getById(id!),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (artist && isEdit) {
      setFormData({
        name: artist.name || '',
        nationality: artist.nationality || '',
        genre: artist.genre || '',
        bio: artist.bio || '',
      });
    }
  }, [artist, isEdit]);

  const createMutation = useMutation({
    mutationFn: (data: CreateArtistDto) => artistsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      navigate('/artists');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateArtistDto) => artistsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
      navigate(`/artists/${id}`);
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
        <h1 className="page-title">{isEdit ? t('artists.editTitle') : t('artists.newTitle')}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-container">
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
              <label htmlFor="nationality" className="form-label">
                {t('common.nationality')}
              </label>
              <input
                id="nationality"
                type="text"
                className="form-input"
                value={formData.nationality}
                onChange={(e) => setFormData((prev) => ({ ...prev, nationality: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="genre" className="form-label">
                {t('common.genre')}
              </label>
              <input
                id="genre"
                type="text"
                className="form-input"
                value={formData.genre}
                onChange={(e) => setFormData((prev) => ({ ...prev, genre: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio" className="form-label">
              {t('common.bio')}
            </label>
            <textarea
              id="bio"
              className="form-textarea"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
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
              onClick={() => navigate(isEdit ? `/artists/${id}` : '/artists')}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
