import { Routes, Route, Navigate } from 'react-router-dom';

import Protected from '@/app/shared/components/Protected';

import LoginPage from '@/app/feature/auth/LoginPage';
import Logout from '@/app/feature/auth/Logout';

import HomePage from '@/app/feature/home/HomePage';

import { PawnsWorkspace } from '@/app/feature/pawns';
import PawnsMaintainWorkspace from './feature/pawns/maintain/PawnsMaintainWorkspace';
import ForfeitWorkspace from './feature/pawns/forfeit/ForfeitWorkspace';

import CustomerPage from '@/app/feature/_shared/customer/CustomerPage';

import PaymentCreatePage from '@/app/feature/payments/PaymentCreatePage';

import ReportsPage from '@/app/feature/reports/ReportsPage';
import { DailyReportPage } from './feature/reports/dailly/DailyReportPage';
import { PoliceReportPage } from './feature/reports/police/PoliceReportPage';
import { ForfeitReportPage } from './feature/reports/forfeit/ForfeitReportPage';

import SalesWorkspace from '@/app/feature/sales/SalesWorkspace';
import SalesMaintainWorkspace from '@/app/feature/sales/maintain/SalesMaintainWorkspace';

export default function AppRouter() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<Logout />} />

      {/* Home */}
      <Route path="/" element={<Protected><HomePage /></Protected>} />

      {/* Pawns routes */}
      <Route path="/pawns" element={<Protected><PawnsWorkspace /></Protected>} />
      <Route path="/pawns/maintain" element={<Protected><PawnsMaintainWorkspace /></Protected>} />
      <Route path="/pawns/forfeit" element={<Protected><ForfeitWorkspace /></Protected>} />

      {/* Customer routes */}
      <Route path="/customer" element={<Protected><CustomerPage /></Protected>} />

      {/* Payment routes */}
      <Route path="/payments" element={<Protected><PaymentCreatePage /></Protected>} />

      {/* Reports routes */}
      <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/reports/daily" element={<Protected><DailyReportPage /></Protected>} />
      <Route path="/reports/police" element={<Protected><PoliceReportPage /></Protected>} />
      <Route path="/reports/forfeit" element={<Protected><ForfeitReportPage /></Protected>} />

      {/* Sales routes */}
      <Route path="/sales" element={<Protected><SalesWorkspace /></Protected>} />
      <Route path="/sales/maintain" element={<Protected><SalesMaintainWorkspace /></Protected>} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
