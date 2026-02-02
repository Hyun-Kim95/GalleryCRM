import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customersApi, Customer, CustomerStatus, SearchCustomerParams } from '../api/customers.api';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/date';

export const CustomersList = () => {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useState<SearchCustomerParams>({
    page: 1,
    limit: 20,
  });

  // 고객 목록 조회
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      const result = await customersApi.search(searchParams);
      // 디버깅: createdAt 값 확인
      if (result?.data) {
        console.log('고객 목록 응답:', result.data.map(c => ({ 
          id: c.id, 
          name: c.name, 
          createdAt: c.createdAt,
          createdAtType: typeof c.createdAt 
        })));
      }
      return result;
    },
  });

  // 고객 삭제
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.softDelete(id),
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? '고객 삭제 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const handleDelete = (customer: Customer) => {
    const canDeleteStatus =
      customer.status === CustomerStatus.DRAFT ||
      customer.status === CustomerStatus.PENDING ||
      customer.status === CustomerStatus.REJECTED;

    const isOwner = customer.createdById === user?.id;
    const isAdminLike = user?.role === 'ADMIN' || user?.role === 'MASTER';

    if (!canDeleteStatus) {
      alert('승인된 고객은 삭제할 수 없습니다.');
      return;
    }

    if (!isOwner && !isAdminLike) {
      alert('이 고객을 삭제할 권한이 없습니다.');
      return;
    }

    if (!window.confirm('해당 고객을 삭제하시겠습니까?\n(삭제 후 1년 경과 시 완전히 삭제됩니다)')) {
      return;
    }

    deleteMutation.mutate(customer.id);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }));
  };

  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.APPROVED:
        return '#27ae60';
      case CustomerStatus.PENDING:
        return '#f39c12';
      case CustomerStatus.REJECTED:
        return '#e74c3c';
      case CustomerStatus.DRAFT:
        return '#95a5a6';
      default:
        return '#34495e';
    }
  };

  const getStatusLabel = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.APPROVED:
        return '승인됨';
      case CustomerStatus.PENDING:
        return '대기중';
      case CustomerStatus.REJECTED:
        return '반려됨';
      case CustomerStatus.DRAFT:
        return '초안';
      default:
        return status;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>고객 관리 (CRM 고객)</h1>
          <p style={{ color: '#7f8c8d', marginTop: '4px' }}>
            로그인 계정이 아닌, 갤러리의 실제 고객 정보를 관리합니다.
          </p>
        </div>
        <Link
          to="/customers/new"
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          + 새 고객 등록
        </Link>
      </div>

      {/* 검색 필터 */}
      <form
        onSubmit={handleSearch}
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              키워드 검색
            </label>
            <input
              type="text"
              placeholder="이름, 이메일, 전화번호"
              value={searchParams.keyword || ''}
              onChange={(e) => setSearchParams((prev) => ({ ...prev, keyword: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              상태
            </label>
            <select
              value={searchParams.status || ''}
              onChange={(e) =>
                setSearchParams((prev) => ({
                  ...prev,
                  status: e.target.value ? (e.target.value as CustomerStatus) : undefined,
                }))
              }
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">전체</option>
              <option value={CustomerStatus.DRAFT}>초안</option>
              <option value={CustomerStatus.PENDING}>대기중</option>
              <option value={CustomerStatus.APPROVED}>승인됨</option>
              <option value={CustomerStatus.REJECTED}>반려됨</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              시작일
            </label>
            <input
              type="date"
              value={searchParams.startDate || ''}
              onChange={(e) => setSearchParams((prev) => ({ ...prev, startDate: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              종료일
            </label>
            <input
              type="date"
              value={searchParams.endDate || ''}
              onChange={(e) => setSearchParams((prev) => ({ ...prev, endDate: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchParams({ page: 1, limit: 20 });
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            초기화
          </button>
        </div>
      </form>

      {/* 고객 목록 */}
      {isLoading && <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>}
      {error && (
        <div style={{ backgroundColor: '#e74c3c', color: 'white', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      {data && (
        <>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>이름</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>이메일</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>전화번호</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>상태</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>생성일</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                      고객 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.data.map((customer) => (
                    <tr
                      key={customer.id}
                      style={{
                        borderBottom: '1px solid #ecf0f1',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <Link
                          to={`/customers/${customer.id}`}
                          style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                          {customer.name}
                        </Link>
                        {customer.isMasked && (
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: '#e74c3c',
                              backgroundColor: '#ffeaa7',
                              padding: '2px 6px',
                              borderRadius: '3px',
                            }}
                          >
                            마스킹됨
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>{customer.email || '-'}</td>
                      <td style={{ padding: '12px' }}>{customer.phone || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: getStatusColor(customer.status),
                            color: 'white',
                          }}
                        >
                          {getStatusLabel(customer.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                        {formatDate(customer.createdAt)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link
                            to={`/customers/${customer.id}`}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3498db',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontSize: '14px',
                            }}
                          >
                            보기
                          </Link>
                          <button
                            onClick={() => handleDelete(customer)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '14px',
                              cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                              opacity: deleteMutation.isPending ? 0.7 : 1,
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {data.totalPages > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: data.page === 1 ? '#ecf0f1' : 'white',
                  cursor: data.page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                이전
              </button>
              <span style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                {data.page} / {data.totalPages} (총 {data.total}건)
              </span>
              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= data.totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: data.page >= data.totalPages ? '#ecf0f1' : 'white',
                  cursor: data.page >= data.totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

