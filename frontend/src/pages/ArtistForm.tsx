import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { artistsApi, CreateArtistDto } from '../api/artists.api';

export const ArtistForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useMutation({
    mutationFn: (data: CreateArtistDto) => artistsApi.create(data),
    onSuccess: (artist) => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      navigate(`/artists/${artist.id}`);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ?? '작가 생성 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('작가 이름을 입력해주세요.');
      return;
    }

    const payload: CreateArtistDto = {
      name: name.trim(),
      nationality: nationality.trim() || undefined,
      genre: genre.trim() || undefined,
      bio: bio.trim() || undefined,
      isActive,
    };

    createMutation.mutate(payload);
  };

  const isLoading = createMutation.isPending;

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <Link
          to="/artists"
          style={{ color: '#3498db', textDecoration: 'none' }}
        >
          ← 목록으로 돌아가기
        </Link>
        <h1 style={{ margin: '10px 0 0 0' }}>새 작가 등록</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              이름 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              국적
            </label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
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
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              장르
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
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
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              소개
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'inherit',
              }}
              placeholder="작가 소개를 입력하세요 (선택)"
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              상태
            </label>
            <label style={{ fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              활성
            </label>
          </div>
        </div>

        <div
          style={{
            marginTop: '30px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/artists')}
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
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? '생성 중...' : '생성'}
          </button>
        </div>
      </form>
    </div>
  );
};


