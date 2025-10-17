import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import PetsPage from "@/pages/PetsPage";
import BookingsPage from "@/pages/BookingsPage";
import MessengerPage from "@/pages/MessengerPage";
import CalendarPage from "@/pages/CalendarPage";
import ClientsPage from "@/pages/ClientsPage";
import RoomsPage from "@/pages/RoomsPage";
import TasksPage from "@/pages/TasksPage";
import IncidentsPage from "@/pages/IncidentsPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import LocationsManagementPage from "@/pages/LocationsManagementPage";

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
      
      <Route path="/calendar" element={
        <ProtectedRoute>
          <DashboardLayout><CalendarPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/clients" element={
        <ProtectedRoute>
          <DashboardLayout><ClientsPage /></DashboardLayout>
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
      
      <Route path="/rooms" element={
        <ProtectedRoute>
          <DashboardLayout><RoomsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tasks" element={
        <ProtectedRoute>
          <DashboardLayout><TasksPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/messenger" element={
        <ProtectedRoute>
          <DashboardLayout><MessengerPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/incidents" element={
        <ProtectedRoute>
          <DashboardLayout><IncidentsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <DashboardLayout><ProfilePage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout><SettingsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/locations" element={
        <ProtectedRoute>
          <DashboardLayout><LocationsManagementPage /></DashboardLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
