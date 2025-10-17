
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Dog, Users, Bed, Settings, LogOut, Truck, ClipboardList, MessageSquare, GanttChartSquare, Building, User, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LocationSwitcher from '@/components/LocationSwitcher';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/bookings', icon: Calendar, label: 'Daycare' },
    { to: '/bookings/boarding', icon: Bed, label: 'Boarding' },
    { to: '/calendar', icon: GanttChartSquare, label: 'Calendar' },
    { to: '/clients', icon: Users, label: 'Clients & Pets' },
    { to: '/rooms', icon: Dog, label: 'Rooms' },
    { to: '/scheduling', icon: GanttChartSquare, label: 'Scheduling' },
    { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
    { to: '/communications', icon: MessageSquare, label: 'Communications' },
    { to: '/incidents', icon: AlertTriangle, label: 'Log Incident' },
    { to: '/bookings/transport', icon: Truck, label: 'Transport' },
];

const bottomNavItems = [
    { to: '/user/profile', icon: User, label: 'My Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

const NavItem = ({ item, isCollapsed }) => {
    const location = useLocation();
    const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <NavLink
                        to={item.to}
                        className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
                            isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                        {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </NavLink>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right"><p>{item.label}</p></TooltipContent>}
            </Tooltip>
        </TooltipProvider>
    );
};

const Sidebar = () => {
    const { signOut } = useAuth();
    const { profile } = useUser();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const isAdmin = profile?.roles?.name === 'Admin';

    return (
        <motion.div
            className={`relative flex flex-col bg-card text-card-foreground border-r border-border h-full transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
        >
            <div className={`flex items-center p-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary rounded-lg">
                            <Dog className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <h1 className="text-xl font-bold">PetSuite</h1>
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <motion.div
                        animate={{ rotate: isCollapsed ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
                    </motion.div>
                </Button>
            </div>
            
            <div className="p-2">
                <LocationSwitcher isCollapsed={isCollapsed} />
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map(item => <NavItem key={item.to} item={item} isCollapsed={isCollapsed} />)}
            </nav>

            <div className="px-2 py-4 mt-auto">
                {isAdmin && <NavItem item={{ to: '/locations', icon: Building, label: 'Manage Locations' }} isCollapsed={isCollapsed} />}
                {bottomNavItems.map(item => <NavItem key={item.to} item={item} isCollapsed={isCollapsed} />)}
                
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={signOut}
                                className={`flex items-center p-3 my-1 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                                {!isCollapsed && <span className="font-medium">Log Out</span>}
                            </button>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right"><p>Log Out</p></TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
            </div>
        </motion.div>
    );
};

export default Sidebar;
