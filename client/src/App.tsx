import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuth } from '@/app/core/auth/authService';
import Protected from '@/app/shared/components/Protected';
import LoginPage from '@/app/feature/auth/LoginPage';
// ...existing imports...

export default function App() {
  // ❌ Remove any auth initialization here
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Protected><HomePage /></Protected>} />
        {/* ...existing routes... */}
      </Routes>
    </BrowserRouter>
  );
}
