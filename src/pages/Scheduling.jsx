
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Trash2, Loader2, MapPin, Calendar as CalendarIcon, CheckCircle, XCircle, Send, MoreHorizontal, Plane, Plus } from 'lucide-react';
import { format, addDays, startOfWeek, add, getDay, isSameDay, parse, isWithinInterval, formatISO, parseISO, set } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dayToColumnId = (date) => `day-${getDay(date)}`;
const dayOfWeekAsString = (date) => format(date, 'EEEE').toLowerCase();

const isAvailable = (staffMember, start, end) => {
    if (!staffMember || !staffMember.availability) return true;

    const dayString = dayOfWeekAsString(start);
    const availabilityForDay = staffMember.availability[dayString];

    if (!availabilityForDay || availabilityForDay.length === 0) return false;

    const shiftStartTime = format(start, 'HH:mm');
    const shiftEndTime = format(end, 'HH:mm');

    return availabilityForDay.some(slot => shiftStartTime >= slot.start && shiftEndTime <= slot.end);
};

const TimeOffRequestForm = ({ onSuccessfulSubmit }) => {
    const { profile } = useUser();
    const { toast } = useToast();
    const [dateRange, setDateRange] = React.useState({ from: undefined, to: undefined });
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async () => {
        if (!profile || !dateRange.from || !dateRange.to || !reason) {
            toast({
                title: 'Missing Information',
                description: 'Please fill out all fields.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.from('time_off_requests').insert({
            user_id: profile.user_id,
            start_date: formatISO(dateRange.from, { representation: 'date' }),
            end_date: formatISO(dateRange.to, { representation: 'date' }),
            reason,
            status: 'pending',
        });

        if (error) {
            toast({ title: 'Error submitting request', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Request Submitted!', description: 'Your time-off request has been sent for approval.' });
            setDateRange({ from: undefined, to: undefined });
            setReason('');
            if (onSuccessfulSubmit) onSuccessfulSubmit();
            setIsOpen(false);
        }
        setIsSubmitting(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><Plane className="mr-2 h-4 w-4" /> Request Time Off</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Time Off</DialogTitle>
                    <DialogDescription>Select the dates and provide a reason for your request.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date-range">Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-range"
                                    variant={"outline"}
                                    className={`w-full justify-start text-left font-normal ${!dateRange.from && "text-muted-foreground"}`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                            `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea id="reason" placeholder="e.g., Family vacation" value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};

const TimeOffManagement = ({ locationId, onUpdate }) => {
    const { toast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        if (!locationId) return;
        setLoading(true);
        
        const { data, error } = await supabase
            .from('time_off_requests')
            .select(`
                id, start_date, end_date, reason, status, created_at,
                profiles:user_id ( full_name, avatar_url, location_id )
            `)
            .eq('profiles.location_id', locationId)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ title: 'Error fetching time off requests', description: error.message, variant: 'destructive' });
            setRequests([]);
        } else {
            setRequests(data);
        }
        setLoading(false);
    }, [locationId, toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);
    
    const handleStatusChange = async (requestId, status, reviewedById) => {
        const { error } = await supabase
            .from('time_off_requests')
            .update({ status: status, reviewed_by: reviewedById })
            .eq('id', requestId);

        if (error) {
            toast({ title: `Error ${status === 'approved' ? 'approving' : 'denying'} request`, description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: `Request has been ${status}.` });
            fetchRequests();
            if (onUpdate) onUpdate();
        }
    };

    const handleDeleteRequest = async (requestId) => {
        const { error } = await supabase
            .from('time_off_requests')
            .delete()
            .eq('id', requestId);
        
        if (error) {
            toast({ title: 'Error deleting request', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Request Deleted', description: 'The time off request has been removed.' });
            fetchRequests();
            if (onUpdate) onUpdate();
        }
    };

    const { profile } = useUser();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Time Off Requests</CardTitle>
                <CardContent className="p-0 pt-4">
                     {loading ? (
                         <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                     ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No pending requests.</div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map(request => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Avatar className="h-8 w-8 text-xs">
                                                <AvatarImage src={request.profiles?.avatar_url} />
                                                <AvatarFallback>{(request.profiles?.full_name || 'U').split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            {request.profiles?.full_name || 'Unknown User'}
                                        </TableCell>
                                        <TableCell>{format(new Date(request.start_date), 'MMM d, y')} - {format(new Date(request.end_date), 'MMM d, y')}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                                        <TableCell>
                                            <Badge variant={request.status === 'approved' ? 'default' : request.status === 'denied' ? 'destructive' : 'secondary'}>{request.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {request.status === 'pending' ? (
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, 'approved', profile.user_id)}><CheckCircle className="h-4 w-4 mr-1 text-green-500"/> Approve</Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, 'denied', profile.user_id)}><XCircle className="h-4 w-4 mr-1 text-red-500"/> Deny</Button>
                                                </div>
                                            ) : (
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleDeleteRequest(request.id)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </CardHeader>
        </Card>
    );
};

const Scheduling = () => {
    const { toast } = useToast();
    const { selectedLocation } = useLocation();

    const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [allStaff, setAllStaff] = useState([]);
    const [shifts, setShifts] = useState({});
    const [shiftTemplates, setShiftTemplates] = useState([]);
    const [timeOff, setTimeOff] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
    const [shiftDetails, setShiftDetails] = useState(null);
    
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

    const fetchData = useCallback(async () => {
        if (!selectedLocation) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const staffPromise = supabase.from('profiles').select('id, user_id, full_name, avatar_url, availability, roles(id, name)').eq('location_id', selectedLocation.id);
        
        const weekStart = format(currentWeek, 'yyyy-MM-dd HH:mm:ss');
        const weekEnd = format(addDays(currentWeek, 7), 'yyyy-MM-dd HH:mm:ss');
        
        const shiftsPromise = supabase.from('shifts').select('*, profiles:user_id(id, user_id, full_name, avatar_url), shift_templates(name)')
            .eq('location_id', selectedLocation.id)
            .gte('start_time', weekStart)
            .lt('start_time', weekEnd);

        const templatesPromise = supabase.from('shift_templates').select('*').eq('location_id', selectedLocation.id);

        const timeOffPromise = supabase
            .from('time_off_requests')
            .select(`*, profiles:user_id(full_name, user_id, location_id)`)
            .eq('status', 'approved')
            .eq('profiles.location_id', selectedLocation.id);

        const [
            { data: staffData, error: staffError },
            { data: shiftsData, error: shiftsError },
            { data: templatesData, error: templatesError },
            { data: timeOffData, error: timeOffError },
        ] = await Promise.all([staffPromise, shiftsPromise, templatesPromise, timeOffPromise]);

        if (staffError) toast({ title: 'Error fetching staff', description: staffError.message, variant: 'destructive' });
        else setAllStaff(staffData || []);
        
        if (shiftsError) toast({ title: 'Error fetching shifts', description: shiftsError.message, variant: 'destructive' });
        else {
            const groupedShifts = weekDays.reduce((acc, day) => {
                const dayKey = dayToColumnId(day);
                const dayShifts = (shiftsData || []).filter(shift => isSameDay(new Date(shift.start_time), day));
                acc[dayKey] = dayShifts.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
                return acc;
            }, {});
            setShifts(groupedShifts);
        }

        if (templatesError) toast({ title: 'Error fetching templates', description: templatesError.message, variant: 'destructive' });
        else setShiftTemplates(templatesData || []);

        if (timeOffError) toast({ title: 'Error fetching time off', description: timeOffError.message, variant: 'destructive' });
        else setTimeOff(timeOffData || []);

        setLoading(false);
    }, [selectedLocation, currentWeek, toast]);

    useEffect(() => {
        if (selectedLocation) {
            fetchData();
        } else {
            setAllStaff([]);
            setShifts({});
            setShiftTemplates([]);
            setTimeOff([]);
            setLoading(false);
        }
    }, [fetchData, selectedLocation]);

    const handleOpenEditShift = (shift) => {
        setShiftDetails({
            id: shift.id,
            date: parseISO(shift.start_time),
            start_time: format(parseISO(shift.start_time), 'HH:mm'),
            end_time: format(parseISO(shift.end_time), 'HH:mm'),
            user_id: shift.user_id,
            shift_template_id: shift.shift_template_id,
        });
        setIsShiftDialogOpen(true);
    };

    const handleOpenCreateShift = (template, date) => {
        const [startHours, startMinutes] = template.start_time.split(':').map(Number);
        const [endHours, endMinutes] = template.end_time.split(':').map(Number);

        const startDateTime = set(date, { hours: startHours, minutes: startMinutes });
        const endDateTime = set(date, { hours: endHours, minutes: endMinutes });

        setShiftDetails({
            id: null, // This is a new shift
            date: date,
            start_time: format(startDateTime, 'HH:mm'),
            end_time: format(endDateTime, 'HH:mm'),
            user_id: null,
            shift_template_id: template.id,
        });
        setIsShiftDialogOpen(true);
    };

    const handleSaveShift = async () => {
        if (!selectedLocation || !shiftDetails) return;
        
        if (!shiftDetails.date || !shiftDetails.start_time || !shiftDetails.end_time) {
            toast({ title: 'Missing Details', description: 'Please fill in all shift details.', variant: 'destructive' });
            return;
        }

        const startDateTime = parse(shiftDetails.start_time, 'HH:mm', shiftDetails.date);
        const endDateTime = parse(shiftDetails.end_time, 'HH:mm', shiftDetails.date);
        
        const staffMember = shiftDetails.user_id ? allStaff.find(s => s.user_id === shiftDetails.user_id) : null;
        if (staffMember && !isAvailable(staffMember, startDateTime, endDateTime)) {
            toast({ title: 'Scheduling Conflict', description: `${staffMember.full_name} is not available for this shift.`, variant: 'destructive' });
            return;
        }

        const shiftData = {
            user_id: shiftDetails.user_id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            location_id: selectedLocation.id,
            shift_template_id: shiftDetails.shift_template_id,
        };

        let error;
        if (shiftDetails.id) { // Update existing shift
            ({ error } = await supabase.from('shifts').update(shiftData).eq('id', shiftDetails.id));
        } else { // Create new shift
            ({ error } = await supabase.from('shifts').insert(shiftData));
        }

        if (error) {
            toast({ title: 'Error saving shift', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: `Shift ${shiftDetails.id ? 'Updated' : 'Created'}!`, description: `The shift has been successfully ${shiftDetails.id ? 'updated' : 'created'}.` });
            setIsShiftDialogOpen(false);
            fetchData();
        }
    };
    
    const handleDeleteShift = async (shiftId) => {
        const { error } = await supabase.from('shifts').delete().eq('id', shiftId);
        if (error) {
             toast({ title: 'Error deleting shift', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Shift Deleted', description: 'The shift has been removed from the schedule.' });
            setIsShiftDialogOpen(false);
            fetchData();
        }
    };

    const changeWeek = (direction) => {
        setCurrentWeek(prev => add(prev, { weeks: direction }));
    };

    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        return names.map(n => n[0]).join('').toUpperCase();
    };

    const availableStaffForShift = useMemo(() => {
        if (!shiftDetails || !shiftDetails.date || !shiftDetails.start_time || !shiftDetails.end_time) return allStaff;
        try {
            const start = parse(shiftDetails.start_time, 'HH:mm', shiftDetails.date);
            const end = parse(shiftDetails.end_time, 'HH:mm', shiftDetails.date);
            return allStaff.filter(staff => isAvailable(staff, start, end));
        } catch (e) {
            return allStaff;
        }
    }, [shiftDetails, allStaff]);

    const renderNoLocation = () => (
        <Card className="flex flex-col items-center justify-center p-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4"/>
            <CardTitle>No Location Selected</CardTitle>
            <CardContent className="text-center p-0 pt-2"><p>Please select a location from the top menu to view the schedule.</p></CardContent>
        </Card>
    );

    const renderScheduler = () => (
        <div className="col-span-12 grid grid-cols-7 gap-3">
            {weekDays.map(day => {
                const dayKey = dayToColumnId(day);
                const dayName = dayOfWeekAsString(day);
                const dailyTimeOff = timeOff.filter(to => isWithinInterval(day, { start: new Date(to.start_date), end: new Date(to.end_date) }));
                const existingShifts = shifts[dayKey] || [];
                
                const dailyTemplates = shiftTemplates
                    .filter(t => t.days_of_week?.includes(dayName))
                    .filter(t => !existingShifts.some(s => s.shift_template_id === t.id)); // Filter out templates that already have a shift

                return (
                    <Card key={day.toString()} className="flex flex-col">
                        <CardHeader className="p-4"><CardTitle className="text-lg text-center">{format(day, 'EEE')}</CardTitle><p className="text-center text-muted-foreground text-sm">{format(day, 'd')}</p></CardHeader>
                        <CardContent className="p-2 flex-grow">
                             <div className="space-y-2 min-h-[300px] rounded-md transition-colors">
                                {dailyTimeOff.map(to => (
                                    <div key={`to-${to.id}`} className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-500 flex items-center gap-2">
                                        <Plane className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">{to.profiles.full_name} on leave</p>
                                    </div>
                                ))}
                                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4"/> : (
                                    <>
                                        {existingShifts.map((shift) => (
                                            <div key={shift.id} onClick={() => handleOpenEditShift(shift)} className="p-3 rounded-lg border bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                                                {shift.profiles ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8 text-xs"><AvatarImage src={shift.profiles.avatar_url} /><AvatarFallback>{getInitials(shift.profiles.full_name)}</AvatarFallback></Avatar>
                                                        <p className="text-sm font-medium">{shift.profiles.full_name}</p>
                                                    </div>
                                                ) : <Badge variant="outline">{shift.shift_templates?.name || 'Open Shift'}</Badge>}
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(shift.start_time), 'p')} - {format(new Date(shift.end_time), 'p')}</p>
                                            </div>
                                        ))}
                                        {dailyTemplates.map(template => (
                                            <div key={`template-${template.id}`} onClick={() => handleOpenCreateShift(template, day)} className="p-3 rounded-lg border border-dashed bg-card/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow opacity-70 hover:opacity-100">
                                                <Badge variant="secondary">{template.name}</Badge>
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3" /> {format(parse(template.start_time, 'HH:mm:ss', new Date()), 'p')} - {format(parse(template.end_time, 'HH:mm:ss', new Date()), 'p')}</p>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    return (
        <>
            <Helmet>
                <title>Scheduling - PetSuite</title>
                <meta name="description" content="Manage staff schedules and shifts." />
            </Helmet>
            <motion.div className="flex-1 space-y-4 p-4 md:p-8 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Scheduling</h1>
                        <p className="text-muted-foreground">Manage weekly shifts and staff time off.</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <TimeOffRequestForm onSuccessfulSubmit={fetchData}/>
                         <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <h2 className="text-xl font-semibold text-center w-40 md:w-64">{format(currentWeek, "MMMM yyyy")}</h2>
                        <Button variant="outline" size="icon" onClick={() => changeWeek(1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
                
                <Tabs defaultValue="schedule" className="space-y-4 mt-4">
                    <TabsList>
                        <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
                        <TabsTrigger value="time-off">Time Off Requests</TabsTrigger>
                    </TabsList>
                    <TabsContent value="schedule">
                        {!selectedLocation ? renderNoLocation() : renderScheduler()}
                    </TabsContent>
                    <TabsContent value="time-off">
                        {!selectedLocation ? renderNoLocation() : <TimeOffManagement locationId={selectedLocation.id} onUpdate={fetchData} />}
                    </TabsContent>
                </Tabs>
            </motion.div>

            <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{shiftDetails?.id ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
                        <DialogDescription>
                            Assign a staff member to this shift.
                        </DialogDescription>
                    </DialogHeader>
                    {shiftDetails && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="staff_member">Assign to</Label>
                                <Select onValueChange={(value) => setShiftDetails(p => ({...p, user_id: value === 'unassigned' ? null : value}))} value={shiftDetails.user_id || 'unassigned'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='unassigned'>Unassigned (Open Shift)</SelectItem>
                                        {availableStaffForShift.map(staff => (
                                            <SelectItem key={staff.user_id} value={staff.user_id}>{staff.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div><Label>Start Time</Label><Input type="time" value={shiftDetails.start_time} readOnly disabled /></div>
                                <div><Label>End Time</Label><Input type="time" value={shiftDetails.end_time} readOnly disabled/></div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="justify-between">
                         {shiftDetails?.id ? (
                            <Button variant="destructive" onClick={() => handleDeleteShift(shiftDetails.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        ) : <div></div>}
                        <Button onClick={handleSaveShift}>{shiftDetails?.id ? 'Save Changes' : 'Create Shift'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Scheduling;
