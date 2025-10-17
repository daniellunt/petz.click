import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Dog, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description, trend, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
            {trend && (
              <p className="text-sm text-green-600 mt-1">↑ {trend}</p>
            )}
          </div>
          <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with real API calls
  const stats = [
    { 
      title: "Total Clients", 
      value: "0", 
      icon: Users, 
      description: "Active clients",
      color: "blue"
    },
    { 
      title: "Total Pets", 
      value: "0", 
      icon: Dog, 
      description: "Registered pets",
      color: "purple"
    },
    { 
      title: "Today's Bookings", 
      value: "0", 
      icon: Calendar, 
      description: "Scheduled today",
      color: "green"
    },
    { 
      title: "Revenue (MTD)", 
      value: "$0", 
      icon: DollarSign, 
      description: "This month",
      trend: "0%",
      color: "orange"
    },
  ];

  const quickActions = [
    {
      title: "Check In Pet",
      description: "Process arrivals for today",
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
      action: () => navigate('/bookings')
    },
    {
      title: "New Booking",
      description: "Create a new reservation",
      icon: Calendar,
      color: "text-blue-600 bg-blue-50",
      action: () => navigate('/bookings')
    },
    {
      title: "Add Client",
      description: "Register new client",
      icon: Users,
      color: "text-purple-600 bg-purple-50",
      action: () => navigate('/clients')
    },
    {
      title: "View Schedule",
      description: "Today's schedule overview",
      icon: Clock,
      color: "text-orange-600 bg-orange-50",
      action: () => navigate('/calendar')
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At a Glance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>At a Glance</CardTitle>
            <CardDescription>Today's activity at your facility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Checked In
                </h3>
                <p className="text-sm text-gray-500 text-center py-8">No pets checked in yet</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Arriving Today
                </h3>
                <p className="text-sm text-gray-500 text-center py-8">No arrivals scheduled</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Departing Today
                </h3>
                <p className="text-sm text-gray-500 text-center py-8">No departures scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No recent activity to display</p>
            <p className="text-sm mt-1">Activity will appear here as you use the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;