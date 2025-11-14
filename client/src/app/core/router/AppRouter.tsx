import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Protected from '@/app/shared/components/Protected';
import LoginPage from '@/app/feature/auth/LoginPage';
import HomePage from '@/app/feature/home/HomePage';
import PawnTicketCreatePage from '@/app/feature/pawnTicket/PawnTicketCreatePage';
import PaymentCreatePage from '@/app/feature/payment/PaymentCreatePage';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Protected><HomePage /></Protected>} />
        
        {/* Pawn ticket routes */}
        <Route path="/pawn-tickets/new" element={<Protected><PawnTicketCreatePage /></Protected>} />
        <Route path="/Pawn" element={<Protected><PawnTicketCreatePage /></Protected>} />
        <Route path="/pawn" element={<Protected><PawnTicketCreatePage /></Protected>} />
        
        {/* Payment routes */}
        <Route path="/Payments" element={<Protected><PaymentCreatePage /></Protected>} />
        <Route path="/payments" element={<Protected><PaymentCreatePage /></Protected>} />
        <Route path="/payments/new" element={<Protected><PaymentCreatePage /></Protected>} />
        
        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Protected><HomePage /></Protected>} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
