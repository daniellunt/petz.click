import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import LocationSwitcher from '@/components/LocationSwitcher';
import { 
  Home, 
  Calendar, 
  Users, 
  Dog, 
  Settings, 
  LogOut, 
  MessageSquare,
  ClipboardList,
  Bed,
  Building,
  User,
  AlertTriangle,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

const navItems = [
  { to: '/home', icon: Home, label: 'Dashboard' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/pets', icon: Dog, label: 'Pets' },
  { to: '/bookings', icon: Bed, label: 'Bookings' },
  { to: '/rooms', icon: Building, label: 'Rooms' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/messenger', icon: MessageSquare, label: 'Messages' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
];

const bottomNavItems = [
  { to: '/profile', icon: User, label: 'My Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const NavItem = ({ item, isCollapsed }) => {
  const location = useLocation();
  const isActive = item.to === '/home' 
    ? location.pathname === '/home' || location.pathname === '/'
    : location.pathname.startsWith(item.to);

  return (
    <NavLink
      to={item.to}
      className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-700 hover:bg-gray-100'
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <item.icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
      {!isCollapsed && <span className="font-medium">{item.label}</span>}
    </NavLink>
  );
};

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Show Locations menu item only for admin users
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo/Header */}
        <div className={`flex items-center p-4 border-b ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Dog className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Pet Resort</h1>
                <p className="text-xs text-gray-500">Business Suite</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-2 bg-blue-600 rounded-lg">
              <Dog className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <div className="px-2 py-2 border-b">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full"
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4 mr-2" />}
            {!isCollapsed && <span className="text-xs">Collapse</span>}
          </Button>
        </div>

        {/* Location Switcher */}
        <div className="px-2 py-2 border-b">
          <LocationSwitcher isCollapsed={isCollapsed} />
        </div>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.to} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-2 py-4 border-t mt-auto">
          {bottomNavItems.map(item => (
            <NavItem key={item.to} item={item} isCollapsed={isCollapsed} />
          ))}
          
          <button
            onClick={handleLogout}
            className={`flex items-center p-3 my-1 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium">Log Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
