import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';

const CheckInList = ({ bookings, onUpdate, loading, title = "Today's Check-ins" }) => {
  const { toast } = useToast();

  const handleCheckIn = async (bookingId) => {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'Checked-in', check_in_time: new Date().toISOString() })
        .eq('id', bookingId);
    
    if (error) {
        toast({ title: 'Check-in Failed', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'Success!', description: 'Pet has been checked in.' });
        onUpdate();
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No check-ins for today.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={booking.pets.avatar_url} alt={booking.pets.name} />
                    <AvatarFallback>{getInitials(booking.pets.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{booking.pets.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.services.name} - Due: {format(new Date(booking.start_date), 'p')}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleCheckIn(booking.id)}>Check-in</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckInList;