import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from "@/components/ui/use-toast";
import StatCard from '@/components/StatCard';
import { Users, Dog, Home, Calendar, DollarSign, ClipboardList, CheckCircle, LogIn, LogOut } from 'lucide-react';
import CheckInList from '@/components/CheckInList';
import CheckOutList from '@/components/CheckOutList';
import { format, startOfDay, endOfDay, isToday } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { Checkbox } from '@/components/ui/checkbox';
import useCurrency from '@/lib/useCurrency';
import { useNavigate } from 'react-router-dom';

const AtAGlance = ({ loading, checkedIn, arriving, departing }) => {
    const navigate = useNavigate();
    const { symbol } = useCurrency();

    const renderBooking = (booking, type) => (
        <div key={booking.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer" onClick={() => navigate(`/pets/${booking.pets.id}`)}>
            <Avatar className="h-10 w-10 border">
                <AvatarImage src={booking.pets.avatar_url} alt={booking.pets.name} />
                <AvatarFallback>{booking.pets.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold text-sm">{booking.pets.name}</p>
                <p className="text-xs text-muted-foreground">{booking.services.name}</p>
            </div>
            {type === 'checkedIn' && <Badge variant="secondary">{format(new Date(booking.check_in_time), 'p')}</Badge>}
            {type === 'arriving' && <Badge variant="outline">{format(new Date(booking.start_date), 'p')}</Badge>}
            {type === 'departing' && <Badge variant="outline">{format(new Date(booking.end_date), 'p')}</Badge>}
        </div>
    );

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle>At a Glance</CardTitle>
                <CardDescription>What's happening today at your facility.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />Checked-in</h3>
                        <div className="space-y-2">
                            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : checkedIn.length > 0 ? checkedIn.map(b => renderBooking(b, 'checkedIn')) : <p className="text-sm text-muted-foreground">Nobody is checked-in yet.</p>}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><LogIn className="h-5 w-5 text-blue-500" />Arriving Today</h3>
                        <div className="space-y-2">
                             {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : arriving.length > 0 ? arriving.map(b => renderBooking(b, 'arriving')) : <p className="text-sm text-muted-foreground">No arrivals scheduled.</p>}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><LogOut className="h-5 w-5 text-red-500" />Departing Today</h3>
                        <div className="space-y-2">
                           {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : departing.length > 0 ? departing.map(b => renderBooking(b, 'departing')) : <p className="text-sm text-muted-foreground">No departures scheduled.</p>}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const MyTasks = ({ loading, tasks, onTaskToggle }) => {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>Your tasks for today.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading tasks...</p>
                    ) : tasks.length > 0 ? (
                        tasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3">
                                <Checkbox id={`task-${task.id}`} checked={task.status === 'completed'} onCheckedChange={() => onTaskToggle(task)} />
                                <label htmlFor={`task-${task.id}`} className={`text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                </label>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No tasks assigned for today. Great job!</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const Dashboard = () => {
    const { selectedLocation } = useLocation();
    const { profile } = useUser();
    const { toast } = useToast();
    const [stats, setStats] = useState({ revenue: 0, checkedIn: 0, arriving: 0, departing: 0 });
    const [glanceData, setGlanceData] = useState({ checkedIn: [], arriving: [], departing: [] });
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { symbol } = useCurrency();

    const fetchDashboardData = useCallback(async () => {
        if (!selectedLocation || !profile) {
            setLoading(false);
            setStats({ revenue: 0, checkedIn: 0, arriving: 0, departing: 0 });
            setGlanceData({ checkedIn: [], arriving: [], departing: [] });
            setMyTasks([]);
            return;
        }

        setLoading(true);

        const todayStart = startOfDay(new Date()).toISOString();
        const todayEnd = endOfDay(new Date()).toISOString();

        const bookingsPromise = supabase
            .from('bookings')
            .select('*, clients!inner(location_id), pets(id, name, avatar_url), services(name)')
            .eq('clients.location_id', selectedLocation.id)
            .or(`and(start_date.gte.${todayStart},start_date.lte.${todayEnd}),and(end_date.gte.${todayStart},end_date.lte.${todayEnd}),status.eq.Checked-in`);
            
        const tasksPromise = supabase
            .from('tasks')
            .select('*')
            .eq('location_id', selectedLocation.id)
            .eq('assigned_to', profile.user_id)
            .eq('status', 'pending')
            .gte('due_date', todayStart)
            .lte('due_date', todayEnd);

        const [
            { data: bookingsData, error: bookingsError },
            { data: tasksData, error: tasksError }
        ] = await Promise.all([bookingsPromise, tasksPromise]);
        
        if (bookingsError || tasksError) {
            toast({ title: "Error fetching dashboard data", description: bookingsError?.message || tasksError?.message, variant: "destructive" });
        } else {
            const todaysRevenue = bookingsData
                .filter(b => b.status === 'Completed' && isToday(new Date(b.end_date)))
                .reduce((sum, b) => sum + (b.total_price || 0), 0);
            
            const checkedInBookings = bookingsData.filter(b => b.status === 'Checked-in');
            const arrivingBookings = bookingsData.filter(b => b.status !== 'Checked-in' && isToday(new Date(b.start_date)));
            const departingBookings = bookingsData.filter(b => b.status === 'Checked-in' && isToday(new Date(b.end_date)));

            setStats({
                revenue: todaysRevenue,
                checkedIn: checkedInBookings.length,
                arriving: arrivingBookings.length,
                departing: departingBookings.length,
            });

            setGlanceData({
                checkedIn: checkedInBookings,
                arriving: arrivingBookings,
                departing: departingBookings,
            });

            setMyTasks(tasksData || []);
        }

        setLoading(false);
    }, [selectedLocation, profile, toast]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);
    
    const handleTaskToggle = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', task.id);
        
        if (error) {
            toast({ title: 'Task update failed', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: `Task marked as ${newStatus}` });
            fetchDashboardData();
        }
    };


    return (
        <>
            <Helmet>
                <title>Dashboard - PetSuite</title>
                <meta name="description" content="Your main hub for managing your pet resort." />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 space-y-4 p-8 pt-6"
            >
                <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Today's Revenue" value={`${symbol}${stats.revenue.toFixed(2)}`} icon={DollarSign} loading={loading} />
                    <StatCard title="Checked-in" value={stats.checkedIn} icon={CheckCircle} loading={loading} description="Currently at the facility" />
                    <StatCard title="Arriving Today" value={stats.arriving} icon={LogIn} loading={loading} />
                    <StatCard title="Departing Today" value={stats.departing} icon={LogOut} loading={loading} />
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    <AtAGlance loading={loading} {...glanceData} />
                    <MyTasks loading={loading} tasks={myTasks} onTaskToggle={handleTaskToggle} />
                </div>
            </motion.div>
        </>
    );
};

export default Dashboard;
