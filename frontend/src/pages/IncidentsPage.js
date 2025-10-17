import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const IncidentsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Incident Log</h1>
        <p className="text-gray-600 mt-1">Track and manage incidents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-gray-500">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Incident logging coming soon</p>
            <p className="text-sm mt-2">Document and track facility incidents</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentsPage;