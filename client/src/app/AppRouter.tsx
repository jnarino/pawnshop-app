import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './feature/home/HomePage';
import CustomerPage from './feature/customer/CustomerPage';
import ReportsPage from './feature/reports/ReportsPage'

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/customer" element={<CustomerPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            {/* add more as you go */}
        </Routes>
    )
}
