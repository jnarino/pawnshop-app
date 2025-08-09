import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './feature/home/HomePage';
import CustomerPage from './feature/customer/CustomerPage';
import ReportsPage from './feature/reports/ReportsPage'
import LoginPage from './feature/auth/LoginPage';
import Protected from './shared/components/Protected';

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
                <Protected><HomePage /></Protected>
            } />
            <Route path="/customer" element={
                <Protected><CustomerPage /></Protected>
            } />
            <Route path="/reports" element={<ReportsPage />} />
            {/* add more as you go */}
        </Routes>
    )
}
