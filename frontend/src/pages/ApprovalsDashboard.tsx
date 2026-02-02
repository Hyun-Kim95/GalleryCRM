import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customersApi, Customer, CustomerStatus, ApproveCustomerDto } from '../api/customers.api';
import { transactionsApi, Transaction, TransactionStatus } from '../api/transactions.api';
import { accessRequestsApi, AccessRequest, AccessRequestStatus, ApproveAccessRequestDto } from '../api/access-requests.api';
import { useAuthStore } from '../store/authStore';
import { formatDate, formatDateTime } from '../utils/date';

export const ApprovalsDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'customers' | 'transactions' | 'access-requests'>('customers');

  // 승인 대기 중인 고객 조회
  const { data: pendingCustomers } = useQuery({
    queryKey: ['customers', { status: CustomerStatus.PENDING }],
    queryFn: () => customersApi.search({ status: CustomerStatus.PENDING, limit: 100 }),
    enabled: activeTab === 'customers',
  });

  // 승인 대기 중인 거래 조회
  const { data: pendingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.getAll(),
    enabled: activeTab === 'transactions',
  });

  // 승인 대기 중인 열람 요청 조회
  const { data: pendingAccessRequests } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => accessRequestsApi.getAll(),
    enabled: activeTab === 'access-requests',
  });

  // 고객 승인/반려
  const approveCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveCustomerDto }) =>
      customersApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      alert('처리되었습니다.');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? '고객 승인/반려 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  // 열람 요청 승인/거부
  const approveAccessRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveAccessRequestDto }) =>
      accessRequestsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      alert('처리되었습니다.');
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ?? '열람 요청 승인/거부 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const handleApproveCustomer = (customer: Customer, action: 'approve' | 'reject') => {
    const rejectionReasonInput =
      action === 'reject' ? prompt('반려 사유를 입력하세요:') : undefined;
    if (action === 'reject' && !rejectionReasonInput) {
      return;
    }

    const data: ApproveCustomerDto = {
      status: action === 'approve' ? CustomerStatus.APPROVED : CustomerStatus.REJECTED,
      rejectionReason: rejectionReasonInput ?? undefined,
    };

    approveCustomerMutation.mutate({ id: customer.id, data });
  };

  const handleApproveAccessRequest = (request: AccessRequest, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const rejectionReason = prompt('거부 사유를 입력하세요:');
      if (!rejectionReason) return;

      const data: ApproveAccessRequestDto = {
        status: AccessRequestStatus.REJECTED,
        rejectionReason,
      };
      approveAccessRequestMutation.mutate({ id: request.id, data });
    } else {
      const hours = prompt('열람 허용 기간(시간)을 입력하세요 (기본: 24):', '24');
      const accessDurationHours = hours ? parseInt(hours) : 24;

      const data: ApproveAccessRequestDto = {
        status: AccessRequestStatus.APPROVED,
        accessDurationHours,
      };
      approveAccessRequestMutation.mutate({ id: request.id, data });
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('APPROVED') || status.includes('승인')) return '#27ae60';
    if (status.includes('PENDING') || status.includes('대기')) return '#f39c12';
    if (status.includes('REJECTED') || status.includes('반려')) return '#e74c3c';
    return '#95a5a6';
  };

  const filteredTransactions = pendingTransactions?.filter(
    (t) => t.status === TransactionStatus.PENDING
  ) || [];

  const filteredAccessRequests = pendingAccessRequests?.filter(
    (r) => r.status === AccessRequestStatus.PENDING
  ) || [];

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>승인 대시보드</h1>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ecf0f1' }}>
        <button
          onClick={() => setActiveTab('customers')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'customers' ? '3px solid #3498db' : '3px solid transparent',
            color: activeTab === 'customers' ? '#3498db' : '#7f8c8d',
            fontWeight: activeTab === 'customers' ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          고객 승인 ({pendingCustomers?.data.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'transactions' ? '3px solid #3498db' : '3px solid transparent',
            color: activeTab === 'transactions' ? '#3498db' : '#7f8c8d',
            fontWeight: activeTab === 'transactions' ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          거래 승인 ({filteredTransactions.length})
        </button>
        {(user?.role === 'ADMIN' || user?.role === 'MASTER') && (
          <button
            onClick={() => setActiveTab('access-requests')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'access-requests' ? '3px solid #3498db' : '3px solid transparent',
              color: activeTab === 'access-requests' ? '#3498db' : '#7f8c8d',
              fontWeight: activeTab === 'access-requests' ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            열람 요청 ({filteredAccessRequests.length})
          </button>
        )}
      </div>

      {/* 고객 승인 탭 */}
      {activeTab === 'customers' && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {pendingCustomers?.data.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
              승인 대기 중인 고객이 없습니다.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>이름</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>이메일</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>요청일</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {pendingCustomers?.data.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '12px' }}>
                      <Link to={`/customers/${customer.id}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                        {customer.name}
                      </Link>
                    </td>
                    <td style={{ padding: '12px' }}>{customer.email || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {formatDate(customer.createdAt)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveCustomer(customer, 'approve')}
                          disabled={approveCustomerMutation.isPending}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleApproveCustomer(customer, 'reject')}
                          disabled={approveCustomerMutation.isPending}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          반려
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 거래 승인 탭 */}
      {activeTab === 'transactions' && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredTransactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
              승인 대기 중인 거래가 없습니다.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>고객</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>작가</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>금액</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>요청일</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '12px' }}>
                      <Link to={`/customers/${transaction.customerId}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                        {transaction.customer?.name || '-'}
                      </Link>
                    </td>
                    <td style={{ padding: '12px' }}>{transaction.artist?.name || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                      {transaction.isMasked ? '***' : `${new Intl.NumberFormat('ko-KR').format(transaction.amount)}원`}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {new Date(transaction.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Link
                        to={`/transactions/${transaction.id}`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 열람 요청 승인 탭 (관리자/마스터만) */}
      {activeTab === 'access-requests' && (user?.role === 'ADMIN' || user?.role === 'MASTER') && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredAccessRequests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
              승인 대기 중인 열람 요청이 없습니다.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>요청자</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>대상</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>사유</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>요청일</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccessRequests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '12px' }}>{request.requester?.name || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <Link
                        to={`/${request.targetType === 'CUSTOMER' ? 'customers' : 'transactions'}/${request.targetId}`}
                        style={{ color: '#3498db', textDecoration: 'none' }}
                      >
                        {request.targetType} - {request.targetId}
                      </Link>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {request.reason || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveAccessRequest(request, 'approve')}
                          disabled={approveAccessRequestMutation.isPending}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleApproveAccessRequest(request, 'reject')}
                          disabled={approveAccessRequestMutation.isPending}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          거부
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

