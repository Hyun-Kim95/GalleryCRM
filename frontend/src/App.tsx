import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CustomersList } from './pages/CustomersList';
import { CustomerDetail } from './pages/CustomerDetail';
import { CustomerForm } from './pages/CustomerForm';
import { TransactionsList } from './pages/TransactionsList';
import { TransactionDetail } from './pages/TransactionDetail';
import { TransactionForm } from './pages/TransactionForm';
import { ArtistsList } from './pages/ArtistsList';
import { ArtistDetail } from './pages/ArtistDetail';
import { ArtistForm } from './pages/ArtistForm';
import { AccessRequestsList } from './pages/AccessRequestsList';
import { ApprovalsDashboard } from './pages/ApprovalsDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { TeamsManagement } from './pages/TeamsManagement';
import { useAuthStore } from './store/authStore';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomersList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Layout>
                  <TransactionsList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <TransactionForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TransactionDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/artists"
            element={
              <ProtectedRoute>
                <Layout>
                  <ArtistsList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/artists/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ArtistForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/artists/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ArtistDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/access-requests"
            element={
              <ProtectedRoute>
                <Layout>
                  <AccessRequestsList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <Layout>
                  <ApprovalsDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamsManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminUsers />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
