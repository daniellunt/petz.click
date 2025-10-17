import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Building, Briefcase, Palette, CreditCard, Truck, Clock, ListChecks, Ruler } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/pages/UserManagement';
import Locations from '@/pages/Locations';
import Services from '@/pages/Services';
import CompanyBrandingSettings from '@/components/settings/CompanyBrandingSettings';
import InvoicingTaxSettings from '@/components/settings/InvoicingTaxSettings';
import TransportSettings from '@/components/settings/TransportSettings';
import ShiftManagement from '@/components/settings/ShiftManagement';
import TaskTemplates from '@/components/settings/TaskTemplates';
import SizeSettings from '@/components/settings/SizeSettings';

const Settings = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const defaultTab = 'users';
    const activeTab = tab || defaultTab;

    const handleTabChange = (value) => {
        navigate(`/settings/${value}`);
    };

    const settingsTabs = [
        { id: 'users', label: 'Users & Roles', icon: Users, component: <UserManagement /> },
        { id: 'locations', label: 'Locations', icon: Building, component: <Locations /> },
        { id: 'services', label: 'Services', icon: Briefcase, component: <Services /> },
        { id: 'shifts', label: 'Shifts', icon: Clock, component: <ShiftManagement /> },
        { id: 'tasks', label: 'Task Templates', icon: ListChecks, component: <TaskTemplates /> },
        { id: 'transport', label: 'Transport', icon: Truck, component: <TransportSettings /> },
        { id: 'sizes', label: 'Pet Sizes', icon: Ruler, component: <SizeSettings /> },
        { id: 'branding', label: 'Branding', icon: Palette, component: <CompanyBrandingSettings /> },
        { id: 'invoicing', label: 'Invoicing & Tax', icon: CreditCard, component: <InvoicingTaxSettings /> },
    ];

    return (
        <>
            <Helmet>
                <title>Settings - PetSuite</title>
                <meta name="description" content="Manage your application settings." />
            </Helmet>
            <motion.div
                className="flex-1 space-y-4 p-8 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <SettingsIcon className="mr-3 h-8 w-8" />
                        Settings
                    </h1>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col md:flex-row gap-6">
                    <TabsList className="flex flex-col h-auto p-2 bg-transparent items-start justify-start w-full md:w-48">
                        {settingsTabs.map(t => (
                            <TabsTrigger key={t.id} value={t.id} className="w-full justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                <t.icon className="mr-2 h-4 w-4" />
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex-1">
                        {settingsTabs.map(t => (
                            <TabsContent key={t.id} value={t.id}>
                                {t.component}
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </motion.div>
        </>
    );
};

export default Settings;