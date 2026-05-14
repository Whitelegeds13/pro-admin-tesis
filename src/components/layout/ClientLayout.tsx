'use client';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingLayout from './LandingLayout';
import AdminLayout from './AdminLayout';

// Landing Pages
import HomePage from '@/views/landing/HomePage';
import ServicesPage from '@/views/landing/ServicesPage';
import AboutPage from '@/views/landing/AboutPage';
import LoginPage from '@/views/landing/LoginPage';
import RegisterPage from '@/views/landing/RegisterPage';

// Admin Pages (placeholder for future implementation)
import AdminDashboard from '@/views/admin/AdminDashboard';
import EmployeeLogin from '@/views/admin/EmployeeLogin';

// Wrapper component for LandingLayout to handle Outlet
function LandingLayoutWrapper() {
  return <LandingLayout><div /></LandingLayout>;
}

export default function ClientLayout() {
  return (
    <Router>
      <Routes>
        {/* Landing Routes */}
        <Route path="/" element={<LandingLayoutWrapper />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="servicios" element={<ServicesPage />} />
          <Route path="acerca-de" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="registro" element={<RegisterPage />} />
        </Route>

        {/* Admin Routes (for future implementation) */}
        <Route path="/admin" element={<AdminLayout><></></AdminLayout>}>
          <Route index element={<AdminDashboard />} />
          <Route path="login" element={<EmployeeLogin />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}