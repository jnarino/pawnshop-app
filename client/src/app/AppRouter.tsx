import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/app/feature/home/HomePage';
import ReportsPage from '@/app/feature/reports/ReportsPage';
import { PawnsWorkspace } from '@/app/feature/pawns';
import PaymentCreatePage from '@/app/feature/payment/PaymentCreatePage';
import CustomerPage from '@/app/feature/customer/CustomerPage';
import LoginPage from '@/app/feature/auth/LoginPage';
import Protected from '@/app/shared/components/Protected';
import Logout from './feature/auth/Logout';

export default function AppRouter() {
  return (
    <Routes>
      {/* public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<Logout />} />

      {/* protected only */}
      <Route path="/" element={<Protected><HomePage /></Protected>} />
      <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/pawns" element={<Protected><PawnsWorkspace /></Protected>} />
      <Route path="/customer" element={<Protected><CustomerPage /></Protected>} />
      <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/pawn" element={<Protected><PawnsWorkspace /></Protected>} />

      {/* ✅ Add payment routes */}
      <Route path="/Payments" element={<Protected><PaymentCreatePage /></Protected>} />
      <Route path="/payments" element={<Protected><PaymentCreatePage /></Protected>} />
      <Route path="/payments/new" element={<Protected><PaymentCreatePage /></Protected>} />

      {/* ✅ Add other main menu routes for consistency */}
      <Route path="/pawn-tickets/new" element={<Protected><PawnsWorkspace /></Protected>} />
      <Route path="/Pawn" element={<Protected><PawnsWorkspace /></Protected>} />
      <Route path="/Sales" element={<Protected><div style={{ padding: '40px', textAlign: 'center' }}>Sales Coming Soon</div></Protected>} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
