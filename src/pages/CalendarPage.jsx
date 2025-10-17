import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar as BigCalendar, ChevronLeft, ChevronRight, Dog, Cat, Bed, Sun } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, eachWeekOfInterval, differenceInDays, max, min } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from '@/contexts/LocationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const CalendarHeader = ({ currentMonth, onMonthChange }) => (
    <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <BigCalendar className="mr-3 h-8 w-8" />
            Bookings Calendar
        </h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onMonthChange(-1)}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-center w-40">{format(currentMonth, "MMMM yyyy")}</h2>
            <Button variant="outline" size="icon" onClick={() => onMonthChange(1)}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    </div>
);

const BookingDetailsDialog = ({ booking, open, onOpenChange }) => {
    if (!booking) return null;

    const isBoarding = booking.appointment_type === 'boarding';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isBoarding ? <Bed className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        {isBoarding ? 'Boarding Details' : 'Daycare Details'}
                    </DialogTitle>
                    <DialogDescription>
                        {format(new Date(booking.start_date), 'PPP')} to {format(new Date(booking.end_date), 'PPP')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link to={`/pets/${booking.pets.id}`}>
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={booking.pets.avatar_url} />
                                <AvatarFallback>{booking.pets.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <h3 className="text-lg font-semibold">{booking.pets.name}</h3>
                            <p className="text-sm text-muted-foreground">{booking.pets.breed}</p>
                        </div>
                    </div>
                    <p><strong>Owner:</strong> <Link to={`/clients/${booking.clients.id}`} className="text-primary hover:underline">{booking.clients.name}</Link></p>
                    <p><strong>Service:</strong> {booking.services.name}</p>
                    {isBoarding && <p><strong>Room:</strong> {booking.rooms?.name || 'Not assigned'}</p>}
                    <p><strong>Status:</strong> <Badge>{booking.status}</Badge></p>
                </div>
            </DialogContent>
        </Dialog>
    );
};


const CalendarPage = () => {
    const { toast } = useToast();
    const { selectedLocation } = useLocation();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!selectedLocation) return;
        setLoading(true);

        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        const { data, error } = await supabase
            .from('bookings')
            .select('*, clients!inner(id, name, location_id), pets!inner(id, name, breed, species, avatar_url), services(name), rooms(name)')
            .eq('clients.location_id', selectedLocation.id)
            .or(`start_date.lte.${format(monthEnd, 'yyyy-MM-dd')},end_date.gte.${format(monthStart, 'yyyy-MM-dd')}`)
            .in('status', ['Confirmed', 'Checked In']);

        if (error) {
            toast({ title: 'Error fetching bookings', description: error.message, variant: 'destructive' });
        } else {
            setBookings(data || []);
        }
        setLoading(false);
    }, [selectedLocation, currentMonth, toast]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleMonthChange = (direction) => {
        setCurrentMonth(prev => direction === 1 ? addMonths(prev, 1) : subMonths(prev, 1));
    };

    const handleBookingClick = (booking) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    const weekDaysHeader = eachDayOfInterval({
        start: startOfWeek(currentMonth, { weekStartsOn: 1 }),
        end: endOfWeek(currentMonth, { weekStartsOn: 1 }),
    });

    const monthWeeks = eachWeekOfInterval(
        { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) },
        { weekStartsOn: 1 }
    );
    
    const processedWeeks = useMemo(() => {
        return monthWeeks.map(weekStart => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
            
            const weekBookings = bookings.filter(b => {
                const bookingStart = new Date(b.start_date);
                const bookingEnd = new Date(b.end_date);
                return bookingStart <= weekEnd && bookingEnd >= weekStart;
            });

            const dayCareBookings = weekBookings.filter(b => b.appointment_type !== 'boarding');
            const boardingBookings = weekBookings.filter(b => b.appointment_type === 'boarding');

            const layout = []; 
            boardingBookings.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            boardingBookings.forEach(booking => {
                let placed = false;
                for (let i = 0; i < layout.length; i++) {
                    if (layout[i].every(b => new Date(b.end_date) < new Date(booking.start_date) || new Date(b.start_date) > new Date(booking.end_date))) {
                        layout[i].push(booking);
                        booking.level = i;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    booking.level = layout.length;
                    layout.push([booking]);
                }
            });
            
            const renderedBoardingBookings = boardingBookings.map(booking => {
                const bookingStart = new Date(booking.start_date);
                const bookingEnd = new Date(booking.end_date);

                const start = max([bookingStart, weekStart]);
                const end = min([bookingEnd, weekEnd]);
                
                const startDayIndex = differenceInDays(start, weekStart);
                const duration = differenceInDays(end, start) + 1;

                return {
                    ...booking,
                    startCol: startDayIndex + 1,
                    span: duration,
                    level: booking.level
                };
            });

            return { weekDays, dayCareBookings, renderedBoardingBookings };
        });
    }, [bookings, monthWeeks]);

    return (
        <>
            <Helmet>
                <title>Bookings Calendar - PetSuite</title>
                <meta name="description" content="View all bookings on a calendar." />
            </Helmet>
            <motion.div
                className="flex-1 space-y-4 p-8 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <CalendarHeader currentMonth={currentMonth} onMonthChange={handleMonthChange} />
                
                <Card>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 border-b">
                            {weekDaysHeader.map(day => (
                                <div key={day.toString()} className="p-2 text-center font-medium text-sm text-muted-foreground">
                                    {format(day, 'EEE')}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1">
                            {processedWeeks.map(({ weekDays, dayCareBookings, renderedBoardingBookings }, weekIndex) => (
                                <div key={weekIndex} className="grid grid-cols-7 relative border-b min-h-[120px]">
                                    {weekDays.map((day, dayIndex) => {
                                        const isCurrentMonth = isSameMonth(day, currentMonth);
                                        const isToday = isSameDay(day, new Date());
                                        const dayCareForDay = dayCareBookings.filter(b => 
                                            new Date(b.start_date) <= day && new Date(b.end_date) >= day
                                        );

                                        return (
                                            <div
                                                key={day.toString()}
                                                className={cn(
                                                    "relative border-r p-2 flex flex-col",
                                                    !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                                                    (dayIndex + 1) % 7 === 0 && "border-r-0"
                                                )}
                                            >
                                                <span className={cn("font-semibold z-10", isToday && "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center")}>
                                                    {format(day, 'd')}
                                                </span>
                                                <div className="mt-1 space-y-1 z-10">
                                                    {dayCareForDay.map(booking => (
                                                        <div
                                                            key={booking.id}
                                                            onClick={() => handleBookingClick(booking)}
                                                            className="p-1 rounded-md text-xs cursor-pointer hover:opacity-80 transition-opacity bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                                                        >
                                                            <div className="flex items-center gap-1 font-semibold truncate">
                                                                {booking.pets.species === 'Dog' ? <Dog className="h-3 w-3" /> : <Cat className="h-3 w-3" />}
                                                                {booking.pets.name}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {renderedBoardingBookings.map(booking => (
                                        <div
                                            key={booking.id}
                                            onClick={() => handleBookingClick(booking)}
                                            className="absolute p-1 rounded-md text-xs cursor-pointer hover:opacity-80 transition-all bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                            style={{
                                                top: `${28 + booking.level * 24}px`, 
                                                left: `calc(${(booking.startCol - 1) / 7 * 100}% + 2px)`,
                                                width: `calc(${booking.span / 7 * 100}% - 4px)`,
                                                height: '22px'
                                            }}
                                        >
                                            <div className="flex items-center gap-1 font-semibold truncate h-full">
                                                <Bed className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{booking.pets.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            <BookingDetailsDialog booking={selectedBooking} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
        </>
    );
};

export default CalendarPage;