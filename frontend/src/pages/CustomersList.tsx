import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { customersApi, Customer, CustomerStatus } from '../api/customers.api';
import { accessRequestsApi, AccessRequestTargetType } from '../api/access-requests.api';
import { formatDate } from '../utils/date';

export const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '' as CustomerStatus | '',
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: () => customersApi.search({
      ...searchParams,
      status: searchParams.status || undefined,
      keyword: searchParams.keyword || undefined,
    }),
  });

  const createAccessRequestMutation = useMutation({
    mutationFn: ({ customerId, reason }: { customerId: string; reason?: string }) =>
      accessRequestsApi.create({
        targetType: AccessRequestTargetType.CUSTOMER,
        targetId: customerId,
        ...(reason ? { reason } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      alert('열람 요청이 등록되었습니다.');
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || '열람 요청 중 오류가 발생했습니다.';
      alert(message);
    },
  });

  const getStatusLabel = (status: CustomerStatus): string => {
    switch (status) {
      case CustomerStatus.DRAFT:
        return '초안';
      case CustomerStatus.PENDING:
        return '대기';
      case CustomerStatus.APPROVED:
        return '승인';
      case CustomerStatus.REJECTED:
        return '반려';
      default:
        return status;
    }
  };

  const getStatusColor = (status: CustomerStatus): string => {
    switch (status) {
      case CustomerStatus.DRAFT:
        return '#95a5a6';
      case CustomerStatus.PENDING:
        return '#f39c12';
      case CustomerStatus.APPROVED:
        return '#27ae60';
      case CustomerStatus.REJECTED:
        return '#e74c3c';
      default:
        return '#34495e';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">고객 목록</h1>
        <Link to="/customers/new" className="button button-primary">
          등록
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="card">
        <form onSubmit={handleSearch} className="search-filter-container">
          <input
            type="text"
            className="search-input"
            placeholder="이름, 이메일, 전화번호로 검색..."
            value={searchParams.keyword}
            onChange={(e) => setSearchParams((prev) => ({ ...prev, keyword: e.target.value, page: 1 }))}
          />
          <select
            className="form-select"
            value={searchParams.status}
            onChange={(e) => setSearchParams((prev) => ({ ...prev, status: e.target.value as CustomerStatus | '', page: 1 }))}
            style={{ minWidth: '150px' }}
          >
            <option value="">전체 상태</option>
            <option value={CustomerStatus.DRAFT}>초안</option>
            <option value={CustomerStatus.PENDING}>대기</option>
            <option value={CustomerStatus.APPROVED}>승인</option>
            <option value={CustomerStatus.REJECTED}>반려</option>
          </select>
          <button type="submit" className="button button-primary">
            검색
          </button>
        </form>
      </div>

      {/* 결과 테이블 */}
      {isLoading && (
        <div className="card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px' }}>
            오류가 발생했습니다. 다시 시도해주세요.
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="card">
            {/* 마스킹 안내 문구 */}
            {data.data.some((c) => c.isMasked) && (
              <div
                style={{
                  marginBottom: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#7f8c8d',
                }}
              >
                이름·이메일·전화번호가 <strong>***</strong>로 표시된 행은 마스킹된 고객입니다. 마지막 열의{' '}
                <strong>열람 요청</strong> 버튼을 눌러 필요한 고객에 대해 열람을 요청하세요.
              </div>
            )}
            <div className="table-container">
              <table className="table table-customers">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>전화번호</th>
                    <th className="col-team">팀</th>
                    <th>상태</th>
                    <th className="col-created-at">등록일</th>
                    <th>작성자</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#95a5a6' }}>
                        고객 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    data.data.map((customer: Customer) => (
                      <tr
                        key={customer.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <td>
                          {customer.isMasked ? '***' : customer.name}
                        </td>
                        <td>{customer.isMasked ? '***' : customer.email || '-'}</td>
                        <td>{customer.isMasked ? '***' : customer.phone || '-'}</td>
                        <td className="col-team">{customer.team?.name || '-'}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: getStatusColor(customer.status),
                              color: 'white',
                            }}
                          >
                            {getStatusLabel(customer.status)}
                          </span>
                        </td>
                        <td className="col-created-at">{formatDate(customer.createdAt)}</td>
                        <td>{customer.createdBy?.name || '-'}</td>
                        <td>
                          {customer.isMasked ? (
                            <button
                              className="button button-outline"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const reason = window.prompt('열람 사유를 입력하세요. (선택 사항)');
                                createAccessRequestMutation.mutate({
                                  customerId: customer.id,
                                  reason: reason || undefined,
                                });
                              }}
                              disabled={createAccessRequestMutation.isPending}
                            >
                              열람 요청
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#95a5a6' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          {data.totalPages > 1 && (
            <div className="pagination">
              <button
                className="button button-outline"
                onClick={() => setSearchParams((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={searchParams.page === 1}
              >
                이전
              </button>
              <span style={{ padding: '0 1rem' }}>
                {searchParams.page} / {data.totalPages} (총 {data.total}개)
              </span>
              <button
                className="button button-outline"
                onClick={() => setSearchParams((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={searchParams.page >= data.totalPages}
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
