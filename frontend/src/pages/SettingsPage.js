import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Shield, DollarSign, Palette, Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const settingsSections = [
    {
      title: 'Locations',
      description: 'Manage your business locations',
      icon: Building,
      color: 'text-blue-600 bg-blue-50',
      action: () => navigate('/locations'),
      adminOnly: true
    },
    {
      title: 'Users & Permissions',
      description: 'Manage staff accounts and access levels',
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
      action: () => navigate('/settings/users'),
      adminOnly: true
    },
    {
      title: 'Roles & Security',
      description: 'Configure role-based access control',
      icon: Shield,
      color: 'text-green-600 bg-green-50',
      action: () => navigate('/settings/roles'),
      adminOnly: true
    },
    {
      title: 'Pricing & Services',
      description: 'Configure services and pricing',
      icon: DollarSign,
      color: 'text-orange-600 bg-orange-50',
      action: () => navigate('/settings/pricing'),
      adminOnly: false
    },
    {
      title: 'Branding',
      description: 'Customize your business appearance',
      icon: Palette,
      color: 'text-pink-600 bg-pink-50',
      action: () => navigate('/settings/branding'),
      adminOnly: false
    },
    {
      title: 'Notifications',
      description: 'Email and notification preferences',
      icon: Bell,
      color: 'text-yellow-600 bg-yellow-50',
      action: () => navigate('/settings/notifications'),
      adminOnly: false
    },
  ];

  const visibleSections = settingsSections.filter(section => 
    !section.adminOnly || (section.adminOnly && isAdmin)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your business settings and preferences</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleSections.map((section, index) => (
          <Card 
            key={index}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={section.action}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${section.color} mb-3`}>
                  <section.icon className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            If you need assistance with any settings, please contact support or refer to our documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;