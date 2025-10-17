import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

const TasksPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600 mt-1">Manage staff tasks and assignments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-gray-500">
            <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Task management coming soon</p>
            <p className="text-sm mt-2">Create, assign, and track tasks for your team</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksPage;