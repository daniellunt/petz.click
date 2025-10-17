
import React from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import { LocationProvider } from '@/contexts/LocationContext';
    import { UserProvider } from '@/contexts/UserContext';
    import { AuthProvider } from '@/contexts/SupabaseAuthContext';
    import Sidebar from '@/components/Sidebar';
    import Dashboard from '@/pages/Dashboard';
    import Bookings from '@/pages/Bookings';
    import Boarding from '@/pages/Boarding';
    import Clients from '@/pages/Clients';
    import ClientProfile from '@/pages/ClientProfile';
    import PetProfile from '@/pages/PetProfile';
    import Rooms from '@/pages/Rooms';
    import UserProfile from '@/pages/UserProfile';
    import Scheduling from '@/pages/Scheduling';
    import Settings from '@/pages/Settings';
    import Transport from '@/pages/Transport';
    import Tasks from '@/pages/Tasks';
    import Timeline from '@/pages/Timeline';
    import Locations from '@/pages/Locations';
    import Communications from '@/pages/Communications';
    import { Toaster } from "@/components/ui/toaster";
    import CreateReportCard from '@/pages/CreateReportCard';
    import MyProfileRedirect from '@/pages/MyProfileRedirect';
    import Login from '@/pages/Login';
    import ProtectedRoute from '@/components/ProtectedRoute';
    import UpdatePassword from '@/pages/UpdatePassword';
    import UserManagement from '@/pages/UserManagement';
    import Services from '@/pages/Services';
    import CalendarPage from '@/pages/CalendarPage';
    import IncidentLog from '@/pages/IncidentLog';
    
    const AppLayout = ({ children }) => (
        <div className="flex flex-col md:flex-row h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
    
    function App() {
        return (
            <Router>
                <AuthProvider>
                    <LocationProvider>
                        <UserProvider>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/update-password" element={<UpdatePassword />} />
                                <Route 
                                    path="/*" 
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout>
                                                <Routes>
                                                    <Route path="/" element={<Dashboard />} />
                                                    <Route path="/dashboard" element={<Navigate to="/" />} />
                                                    <Route path="/bookings" element={<Bookings />} />
                                                    <Route path="/bookings/boarding" element={<Boarding />} />
                                                    <Route path="/bookings/transport" element={<Transport />} />
                                                    <Route path="/calendar" element={<CalendarPage />} />
                                                    <Route path="/clients" element={<Clients />} />
                                                    <Route path="/clients/:clientId" element={<ClientProfile />} />
                                                    <Route path="/pets/:petId" element={<PetProfile />} />
                                                    <Route path="/pets/:petId/create-report" element={<CreateReportCard />} />
                                                    <Route path="/incidents" element={<IncidentLog />} />
                                                    <Route path="/rooms" element={<Rooms />} />
                                                    <Route path="/scheduling" element={<Scheduling />} />
                                                    <Route path="/tasks" element={<Tasks />} />
                                                    <Route path="/timeline" element={<Timeline />} />
                                                    <Route path="/locations" element={<Locations />} />
                                                    <Route path="/communications" element={<Communications />} />
                                                    <Route path="/communications/:tab" element={<Communications />} />
                                                    <Route path="/communications/:tab/:conversationId" element={<Communications />} />
                                                    <Route path="/user/profile" element={<MyProfileRedirect />} />
                                                    <Route path="/users/:profileId" element={<UserProfile />} />
                                                    <Route path="/settings" element={<Settings />} />
                                                    <Route path="/settings/:tab" element={<Settings />} />
                                                </Routes>
                                            </AppLayout>
                                        </ProtectedRoute>
                                    } 
                                />
                            </Routes>
                        </UserProvider>
                    </LocationProvider>
                </AuthProvider>
            </Router>
        );
    }
    
    export default App;
