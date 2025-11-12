import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/app/feature/home/HomePage';
import ReportsPage from '@/app/feature/reports/ReportsPage';
import { PawnsWorkspace } from '@/app/feature/pawns';
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

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
