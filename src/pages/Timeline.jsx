
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, MapPin, Dog, Truck, Users, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/lib/customSupabaseClient';
import { format, addDays, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";

const Timeline = () => {
    const { toast } = useToast();
    const { selectedLocation } = useLocation();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timelineData, setTimelineData] = useState({
        bookings: [],
        routes: [],
        shifts: [],
        tasks: [],
    });

    const fetchData = useCallback(async () => {
        if (!selectedLocation) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        const bookingsPromise = supabase.from('bookings').select('*, clients!inner(name, location_id)').eq('clients.location_id', selectedLocation.id).eq('start_date', dateStr);
        const routesPromise = supabase.from('routes').select('*, vehicles(name), profiles(full_name)').eq('location_id', selectedLocation.id).eq('route_date', dateStr);
        const shiftsPromise = supabase.from('shifts').select('*, profiles:user_id(full_name)').eq('location_id', selectedLocation.id).gte('start_time', `${dateStr}T00:00:00`).lte('start_time', `${dateStr}T23:59:59`);
        const tasksPromise = supabase.from('tasks').select('*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)').eq('location_id', selectedLocation.id).gte('due_date', `${dateStr}T00:00:00`).lte('due_date', `${dateStr}T23:59:59`);

        const [
            { data: bookingsData, error: bookingsError },
            { data: routesData, error: routesError },
            { data: shiftsData, error: shiftsError },
            { data: tasksData, error: tasksError },
        ] = await Promise.all([bookingsPromise, routesPromise, shiftsPromise, tasksPromise]);

        if (bookingsError) toast({ title: "Error fetching bookings", description: bookingsError.message, variant: "destructive" });
        if (routesError) toast({ title: "Error fetching routes", description: routesError.message, variant: "destructive" });
        if (shiftsError) toast({ title: "Error fetching shifts", description: shiftsError.message, variant: "destructive" });
        if (tasksError) toast({ title: "Error fetching tasks", description: tasksError.message, variant: "destructive" });

        setTimelineData({
            bookings: bookingsData || [],
            routes: routesData || [],
            shifts: shiftsData || [],
            tasks: tasksData || [],
        });

        setLoading(false);
    }, [selectedLocation, selectedDate, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const changeDate = (direction) => {
        if (direction === 'prev') {
            setSelectedDate(subDays(selectedDate, 1));
        } else {
            setSelectedDate(addDays(selectedDate, 1));
        }
    };

    const TimelineSection = ({ title, icon: Icon, data, renderItem, emptyText }) => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> :
                    data.length > 0 ? data.map(renderItem) : <p className="text-sm text-muted-foreground text-center py-4">{emptyText}</p>
                }
            </CardContent>
        </Card>
    );

    return (
        <>
            <Helmet>
                <title>Timeline - PetSuite</title>
                <meta name="description" content="Daily overview of all business activities." />
            </Helmet>
            <motion.div
                className="flex-1 space-y-6 p-8 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Business Timeline</h1>
                        <p className="text-muted-foreground">A snapshot of activities for {selectedLocation?.name || 'your location'}.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => changeDate('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(new Date(e.target.value))} className="border-0" />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="icon" onClick={() => changeDate('next')}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>

                {!selectedLocation ? (
                    <Card className="flex flex-col items-center justify-center p-12">
                        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                        <CardTitle>No Location Selected</CardTitle>
                        <CardDescription>Please select a location to view the timeline.</CardDescription>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        <TimelineSection
                            title="Bookings"
                            icon={Calendar}
                            data={timelineData.bookings}
                            emptyText="No bookings for today."
                            renderItem={(item) => (
                                <div key={item.id} className="p-3 border rounded-md bg-background">
                                    <p className="font-medium">{item.clients.name}</p>
                                    <p className={`text-sm ${item.appointment_type === 'Check-in' ? 'text-green-600' : 'text-blue-600'}`}>{item.appointment_type}</p>
                                </div>
                            )}
                        />
                        <TimelineSection
                            title="Transport Routes"
                            icon={Truck}
                            data={timelineData.routes}
                            emptyText="No routes scheduled for today."
                            renderItem={(item) => (
                                <div key={item.id} className="p-3 border rounded-md bg-background">
                                    <p className="font-medium">{item.vehicles.name}</p>
                                    <p className="text-sm text-muted-foreground">Driver: {item.profiles.full_name}</p>
                                </div>
                            )}
                        />
                        <TimelineSection
                            title="Staff Shifts"
                            icon={Users}
                            data={timelineData.shifts}
                            emptyText="No staff shifts for today."
                            renderItem={(item) => (
                                <div key={item.id} className="p-3 border rounded-md bg-background">
                                    <p className="font-medium">{item.profiles.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{format(new Date(item.start_time), 'p')} - {format(new Date(item.end_time), 'p')}</p>
                                </div>
                            )}
                        />
                        <div className="lg:col-span-2 xl:col-span-3">
                            <TimelineSection
                                title="Tasks"
                                icon={Briefcase}
                                data={timelineData.tasks}
                                emptyText="No tasks due today."
                                renderItem={(item) => (
                                    <div key={item.id} className="p-3 border rounded-md bg-background">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">Assigned to: {item.assigned_to_profile?.full_name || 'Unassigned'}</p>
                                        <p className="text-sm text-muted-foreground">Due: {format(new Date(item.due_date), 'p')}</p>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                )}
            </motion.div>
        </>
    );
};

export default Timeline;