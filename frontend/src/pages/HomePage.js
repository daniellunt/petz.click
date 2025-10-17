import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, Calendar, MessageCircle, User } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <PawPrint className="h-8 w-8 text-blue-600" />,
      title: 'Pet Management',
      description: 'Register and manage your pet profiles with ease',
      action: () => navigate('/pets')
    },
    {
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      title: 'Book Services',
      description: 'Schedule daycare, boarding, and introduction services',
      action: () => navigate('/bookings')
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-green-600" />,
      title: 'Messenger',
      description: 'Chat with us and share photos of your pets',
      action: () => navigate('/messenger')
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Luxury Pet Resort
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Premium care for your beloved companions
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/pets')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/bookings')}>
              Book Now
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={feature.action}>
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">Learn More →</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Why Choose Us?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-left space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Mandatory introduction service ensures safe socialization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Flexible booking options for daycare, boarding, and timed services</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Direct messaging with staff and photo updates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Multiple locations for your convenience</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;