import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your business settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-gray-500">
            <Settings className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Settings coming soon</p>
            <p className="text-sm mt-2">Company info, branding, pricing, and more</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;