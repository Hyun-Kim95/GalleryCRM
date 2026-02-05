import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customersApi } from '../api/customers.api';
import { artistsApi } from '../api/artists.api';
import { accessRequestsApi } from '../api/access-requests.api';

export const Dashboard: React.FC = () => {
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'dashboard'],
    queryFn: () => customersApi.search({ limit: 5, page: 1 }),
  });

  const { data: artists } = useQuery({
    queryKey: ['artists', 'dashboard'],
    queryFn: () => artistsApi.getAll(),
  });

  const { data: accessRequests } = useQuery({
    queryKey: ['access-requests', 'dashboard'],
    queryFn: () => accessRequestsApi.getAll(),
  });

  const pendingCustomers = customersData?.data.filter(
    (c) => c.status === 'PENDING'
  ).length || 0;

  const pendingAccessRequests = accessRequests?.filter(
    (r) => r.status === 'PENDING'
  ).length || 0;

  return (
    <div>
      <h1 className="page-title">대시보드</h1>

      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#7f8c8d' }}>전체 고객</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>
            {customersData?.total || 0}
          </p>
        </div>
        <div className="card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#7f8c8d' }}>전체 작가</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>
            {artists?.length || 0}
          </p>
        </div>
        <div className="card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#7f8c8d' }}>승인 대기 고객</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
            {pendingCustomers}
          </p>
        </div>
        <div className="card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#7f8c8d' }}>열람 요청</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>
            {pendingAccessRequests}
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>최근 고객</h2>
            <Link to="/customers" className="button button-outline" style={{ fontSize: '0.875rem' }}>
              전체 보기
            </Link>
          </div>
          {customersData?.data.length === 0 ? (
            <p style={{ color: '#95a5a6' }}>고객 데이터가 없습니다.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {customersData?.data.slice(0, 5).map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <Link to={`/customers/${customer.id}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                          {customer.name}
                        </Link>
                      </td>
                      <td>{customer.status}</td>
                      <td>
                        <Link to={`/customers/${customer.id}`} className="button button-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>빠른 링크</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/customers/new" className="button button-primary">
              고객 등록
            </Link>
            <Link to="/artists/new" className="button button-primary">
              작가 등록
            </Link>
            <Link to="/approvals" className="button button-secondary">
              승인 대기 목록
            </Link>
            <Link to="/access-requests" className="button button-secondary">
              열람 요청 목록
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
