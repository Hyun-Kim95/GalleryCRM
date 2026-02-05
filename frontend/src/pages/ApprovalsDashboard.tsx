import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { customersApi, Customer, CustomerStatus } from '../api/customers.api';
import { artistsApi, Artist, ArtistStatus } from '../api/artists.api';
import { transactionsApi, Transaction, TransactionStatus } from '../api/transactions.api';
import { formatDate } from '../utils/date';
import { useAuthStore } from '../store/authStore';

export const ApprovalsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // 사원(STAFF)은 승인 권한이 없음
  const canApprove = user?.role !== 'STAFF';

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'pending'],
    queryFn: () => customersApi.search({ status: CustomerStatus.PENDING, limit: 100 }),
  });

  const { data: artists } = useQuery({
    queryKey: ['artists', 'pending'],
    queryFn: () => artistsApi.getPending(),
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'pending'],
    queryFn: () => transactionsApi.getAll(),
  });

  const approveCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: CustomerStatus.APPROVED | CustomerStatus.REJECTED; rejectionReason?: string } }) =>
      customersApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const approveArtistMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: ArtistStatus; rejectionReason?: string } }) =>
      artistsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });

  const approveTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: TransactionStatus.APPROVED | TransactionStatus.REJECTED; rejectionReason?: string } }) =>
      transactionsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleApprove = (type: 'customer' | 'artist' | 'transaction', id: string) => {
    if (type === 'customer') {
      approveCustomerMutation.mutate({ id, data: { status: CustomerStatus.APPROVED } });
    } else if (type === 'artist') {
      approveArtistMutation.mutate({ id, data: { status: ArtistStatus.APPROVED } });
    } else {
      approveTransactionMutation.mutate({ id, data: { status: TransactionStatus.APPROVED } });
    }
  };

  const handleReject = (type: 'customer' | 'artist' | 'transaction', id: string) => {
    const reason = prompt('반려 사유를 입력하세요:');
    if (!reason) return;

    if (type === 'customer') {
      approveCustomerMutation.mutate({ id, data: { status: CustomerStatus.REJECTED, rejectionReason: reason } });
    } else if (type === 'artist') {
      approveArtistMutation.mutate({ id, data: { status: ArtistStatus.REJECTED, rejectionReason: reason } });
    } else {
      approveTransactionMutation.mutate({ id, data: { status: TransactionStatus.REJECTED, rejectionReason: reason } });
    }
  };

  const pendingCustomers = customersData?.data || [];
  const pendingArtists = artists || [];
  const pendingTransactions = transactions?.filter((t) => t.status === TransactionStatus.PENDING) || [];

  const formatAmount = (amount: number | string, currency: string = 'KRW'): string => {
    if (typeof amount === 'string') {
      return amount;
    }
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return `0 ${currency}`;
    }
    const formatted = new Intl.NumberFormat('ko-KR').format(amount);
    return `${formatted} ${currency}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">승인 대기</h1>
      </div>

      {/* 고객 승인 대기 */}
      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>고객 승인 대기 ({pendingCustomers.length}건)</h2>
        {pendingCustomers.length === 0 ? (
          <p style={{ color: '#95a5a6' }}>승인 대기 중인 고객이 없습니다.</p>
        ) : (
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>작성자</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {pendingCustomers.map((customer: Customer) => (
                  <tr key={customer.id}>
                    <td>
                      <Link to={`/customers/${customer.id}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                        {customer.name}
                      </Link>
                    </td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.createdBy?.name || '-'}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td>
                      {canApprove ? (
                        <div className="button-group">
                          <button
                            className="button button-primary"
                            onClick={() => handleApprove('customer', customer.id)}
                            disabled={approveCustomerMutation.isPending}
                          >
                            승인
                          </button>
                          <button
                            className="button button-danger"
                            onClick={() => handleReject('customer', customer.id)}
                            disabled={approveCustomerMutation.isPending}
                          >
                            반려
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6', fontSize: '0.875rem' }}>승인 권한 없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 작가 승인 대기 */}
      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>작가 승인 대기 ({pendingArtists.length}건)</h2>
        {pendingArtists.length === 0 ? (
          <p style={{ color: '#95a5a6' }}>승인 대기 중인 작가가 없습니다.</p>
        ) : (
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>국적</th>
                  <th>장르</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {pendingArtists.map((artist: Artist) => (
                  <tr key={artist.id}>
                    <td>
                      <Link to={`/artists/${artist.id}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                        {artist.name}
                      </Link>
                    </td>
                    <td>{artist.nationality || '-'}</td>
                    <td>{artist.genre || '-'}</td>
                    <td>{formatDate(artist.createdAt)}</td>
                    <td>
                      {canApprove ? (
                        <div className="button-group">
                          <button
                            className="button button-primary"
                            onClick={() => handleApprove('artist', artist.id)}
                            disabled={approveArtistMutation.isPending}
                          >
                            승인
                          </button>
                          <button
                            className="button button-danger"
                            onClick={() => handleReject('artist', artist.id)}
                            disabled={approveArtistMutation.isPending}
                          >
                            반려
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6', fontSize: '0.875rem' }}>승인 권한 없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 거래 승인 대기 */}
      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>거래 승인 대기 ({pendingTransactions.length}건)</h2>
        {pendingTransactions.length === 0 ? (
          <p style={{ color: '#95a5a6' }}>승인 대기 중인 거래가 없습니다.</p>
        ) : (
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>고객</th>
                  <th>작가</th>
                  <th>금액</th>
                  <th>거래일</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransactions.map((transaction: Transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <Link to={`/customers/${transaction.customerId}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                        {transaction.isMasked ? '***' : transaction.customer.name}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/artists/${transaction.artistId}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                        {transaction.artist.name}
                      </Link>
                    </td>
                    <td>{transaction.isMasked ? '***' : formatAmount(transaction.amount, transaction.currency)}</td>
                    <td>{formatDate(transaction.transactionDate)}</td>
                    <td>{formatDate(transaction.createdAt)}</td>
                    <td>
                      {canApprove ? (
                        <div className="button-group">
                          <button
                            className="button button-primary"
                            onClick={() => handleApprove('transaction', transaction.id)}
                            disabled={approveTransactionMutation.isPending}
                          >
                            승인
                          </button>
                          <button
                            className="button button-danger"
                            onClick={() => handleReject('transaction', transaction.id)}
                            disabled={approveTransactionMutation.isPending}
                          >
                            반려
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6', fontSize: '0.875rem' }}>승인 권한 없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
