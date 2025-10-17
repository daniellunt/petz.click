import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import PetsPage from "@/pages/PetsPage";
import BookingsPage from "@/pages/BookingsPage";
import MessengerPage from "@/pages/MessengerPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

// Public Route (redirect to home if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/home" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      
      <Route path="/" element={<Navigate to="/home" />} />
      
      <Route path="/home" element={
        <ProtectedRoute>
          <DashboardLayout><HomePage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/pets" element={
        <ProtectedRoute>
          <DashboardLayout><PetsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/bookings" element={
        <ProtectedRoute>
          <DashboardLayout><BookingsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/messenger" element={
        <ProtectedRoute>
          <DashboardLayout><MessengerPage /></DashboardLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
