import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { customersApi, Customer, CustomerStatus, SearchCustomerParams } from '../api/customers.api';
import { accessRequestsApi, AccessRequest, AccessRequestStatus, AccessRequestTargetType, CreateAccessRequestDto } from '../api/access-requests.api';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/date';

export const CustomersList = () => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<SearchCustomerParams>({
    page: 1,
    limit: 20,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [createForm, setCreateForm] = useState<CreateAccessRequestDto>({
    targetType: AccessRequestTargetType.CUSTOMER,
    targetId: '',
    reason: '',
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

  // 열람요청 목록 조회
  const { data: allAccessRequests } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => accessRequestsApi.getAll(),
  });

  // 열람요청 생성
  const createAccessRequestMutation = useMutation({
    mutationFn: (data: CreateAccessRequestDto) => accessRequestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      setShowCreateModal(false);
      setSelectedCustomer(null);
      setCreateForm({ targetType: AccessRequestTargetType.CUSTOMER, targetId: '', reason: '' });
      alert('열람 요청이 생성되었습니다.');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? '열람 요청 생성 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
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

  const handleCreateAccessRequest = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCreateForm({
      targetType: AccessRequestTargetType.CUSTOMER,
      targetId: customer.id,
      reason: '',
    });
    setShowCreateModal(true);
  };

  const handleSubmitAccessRequest = () => {
    if (!createForm.reason?.trim()) {
      alert('열람 사유를 입력해주세요.');
      return;
    }
    createAccessRequestMutation.mutate(createForm);
  };

  const getCustomerAccessRequests = (customerId: string): AccessRequest[] => {
    if (!allAccessRequests) return [];
    return allAccessRequests.filter(
      (req) => req.targetType === AccessRequestTargetType.CUSTOMER && req.targetId === customerId
    );
  };

  const getPendingAccessRequests = (customerId: string): AccessRequest[] => {
    return getCustomerAccessRequests(customerId).filter(
      (req) => req.status === AccessRequestStatus.PENDING
    );
  };

  const hasActiveApprovedAccessRequest = (customerId: string): boolean => {
    const now = new Date();
    return getCustomerAccessRequests(customerId).some((req) => {
      if (req.status !== AccessRequestStatus.APPROVED) return false;
      if (!req.expiresAt) return false;
      return new Date(req.expiresAt) > now;
    });
  };

  const getAccessRequestStatusColor = (status: AccessRequestStatus) => {
    switch (status) {
      case AccessRequestStatus.APPROVED:
        return '#27ae60';
      case AccessRequestStatus.PENDING:
        return '#f39c12';
      case AccessRequestStatus.REJECTED:
        return '#e74c3c';
      default:
        return '#34495e';
    }
  };

  const getAccessRequestStatusLabel = (status: AccessRequestStatus) => {
    switch (status) {
      case AccessRequestStatus.APPROVED:
        return '승인됨';
      case AccessRequestStatus.PENDING:
        return '대기중';
      case AccessRequestStatus.REJECTED:
        return '거부됨';
      default:
        return status;
    }
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
            transition: 'all 0.2s ease',
            display: 'inline-block',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2980b9';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3498db';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
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
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Link
                              to={`/customers/${customer.id}`}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                transition: 'all 0.2s ease',
                                display: 'inline-block',
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
                              보기
                            </Link>
                            {(() => {
                              const pendingCount = getPendingAccessRequests(customer.id).length;
                              const hasActiveApproved = hasActiveApprovedAccessRequest(customer.id);
                              const isMasterLike =
                                user?.role === 'MASTER' ||
                                user?.role === 'MANAGER' ||
                                user?.role === 'ADMIN';

                              // 사원/일반 사용자: 아직 요청 없으면 "열람요청", 있으면 "열람요청 완료"
                              if (!isMasterLike) {
                                // 이미 유효한 승인 열람 권한이 있으면 버튼 자체를 숨김
                                if (hasActiveApproved) {
                                  return null;
                                }
                                if (pendingCount === 0) {
                                  return (
                                    <button
                                      onClick={() => handleCreateAccessRequest(customer)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#9b59b6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#8e44ad';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#9b59b6';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                      }}
                                    >
                                      열람요청
                                    </button>
                                  );
                                }
                                return (
                                  <button
                                    disabled
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#7f8c8d',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      cursor: 'not-allowed',
                                      opacity: 0.8,
                                    }}
                                  >
                                    열람요청 완료
                                  </button>
                                );
                              }

                              // 관리자/마스터/팀장: 승인용으로 열람요청 목록으로 이동
                              if (isMasterLike && pendingCount > 0) {
                                return (
                                  <button
                                    onClick={() => navigate('/access-requests')}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#16a085',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#138d75';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#16a085';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    열람요청
                                  </button>
                                );
                              }

                              return null;
                            })()}
                            <button
                              onClick={() => handleDelete(customer)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#c0392b';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#e74c3c';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
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
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (data.page !== 1) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#3498db';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (data.page !== 1) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#ddd';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
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
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (data.page < data.totalPages) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#3498db';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (data.page < data.totalPages) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#ddd';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    다음
                  </button>
                </div>
              )}
          </>
        )}

      {/* 열람요청 생성 모달 */}
      {showCreateModal && selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowCreateModal(false);
            setSelectedCustomer(null);
            setCreateForm({ targetType: AccessRequestTargetType.CUSTOMER, targetId: '', reason: '' });
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>열람 요청 생성</h2>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>고객:</strong> {selectedCustomer.name} ({selectedCustomer.id})
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                열람 사유 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <textarea
                value={createForm.reason || ''}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="열람 요청 사유를 입력하세요"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedCustomer(null);
                  setCreateForm({ targetType: AccessRequestTargetType.CUSTOMER, targetId: '', reason: '' });
                }}
                style={{
                  padding: '10px 20px',
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
                onClick={handleSubmitAccessRequest}
                disabled={createAccessRequestMutation.isPending}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: createAccessRequestMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!createAccessRequestMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#8e44ad';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!createAccessRequestMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#9b59b6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {createAccessRequestMutation.isPending ? '처리 중...' : '요청 생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

