import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { transactionsApi, Transaction, TransactionStatus } from '../api/transactions.api';

export const TransactionsList = () => {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.getAll(),
  });

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED:
        return '#27ae60';
      case TransactionStatus.PENDING:
        return '#f39c12';
      case TransactionStatus.REJECTED:
        return '#e74c3c';
      case TransactionStatus.DRAFT:
        return '#95a5a6';
      default:
        return '#34495e';
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED:
        return '승인됨';
      case TransactionStatus.PENDING:
        return '대기중';
      case TransactionStatus.REJECTED:
        return '반려됨';
      case TransactionStatus.DRAFT:
        return '초안';
      default:
        return status;
    }
  };

  const formatAmount = (amount: string | number, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return amount;
    return new Intl.NumberFormat('ko-KR').format(numAmount) + (currency === 'KRW' ? '원' : ` ${currency}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>거래 관리</h1>
        <Link
          to="/transactions/new"
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
          + 새 거래 등록
        </Link>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>}
      {error && (
        <div style={{ backgroundColor: '#e74c3c', color: 'white', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      {transactions && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>고객</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>작가</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>금액</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>거래일</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>상태</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                    거래 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
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
                        to={`/customers/${transaction.customerId}`}
                        style={{ color: '#3498db', textDecoration: 'none' }}
                      >
                        {transaction.customer?.name || '-'}
                      </Link>
                    </td>
                    <td style={{ padding: '12px' }}>{transaction.artist?.name || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                      {transaction.isMasked ? '***' : formatAmount(transaction.amount, transaction.currency)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {new Date(transaction.transactionDate).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getStatusColor(transaction.status),
                          color: 'white',
                        }}
                      >
                        {getStatusLabel(transaction.status)}
                      </span>
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
                        보기
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};



