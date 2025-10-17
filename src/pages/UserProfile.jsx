import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { Helmet } from 'react-helmet';
    import { useParams, Link, useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { ChevronLeft, MapPin, Shield, Activity, Edit, Settings, Loader2, Briefcase, Clock, Calendar as CalendarIcon, CheckSquare, Upload, Calendar, ListChecks } from 'lucide-react';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Separator } from '@/components/ui/separator';
    import { Checkbox } from "@/components/ui/checkbox";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { supabase } from '@/lib/customSupabaseClient';
    import { format, parseISO, isFuture, isPast } from "date-fns";
        
    const roleColors = {
        Admin: 'destructive',
        Manager: 'default',
        Staff: 'secondary',
    };

    const RecentActivity = ({ userId, fullName }) => {
        const [tasks, setTasks] = useState([]);
        const [loading, setLoading] = useState(true);
        const { toast } = useToast();
    
        useEffect(() => {
            const fetchTasks = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('tasks')
                    .select('id, title, status, due_date')
                    .eq('assigned_to', userId)
                    .order('due_date', { ascending: false })
                    .limit(5);
    
                if (error) {
                    toast({ title: 'Error fetching tasks', description: error.message, variant: 'destructive' });
                } else {
                    setTasks(data);
                }
                setLoading(false);
            };
            fetchTasks();
        }, [userId, toast]);
    
        if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-5 w-5 animate-spin" /></div>
        if (tasks.length === 0) return <p className="text-muted-foreground text-center p-8">No recent tasks found for {fullName}.</p>
    
        return (
            <ul className="space-y-3">
                {tasks.map(task => (
                    <li key={task.id} className="flex justify-between items-center text-sm">
                        <span>{task.title}</span>
                        <Badge variant={task.status === 'Completed' ? 'default' : 'secondary'}>{task.status}</Badge>
                    </li>
                ))}
            </ul>
        );
    };
    
    const ShiftsTab = ({ userId }) => {
        const [shifts, setShifts] = useState([]);
        const [loading, setLoading] = useState(true);
        const { toast } = useToast();
    
        useEffect(() => {
            const fetchShifts = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('shifts')
                    .select('*')
                    .eq('user_id', userId)
                    .order('start_time', { ascending: false });
    
                if (error) {
                    toast({ title: 'Error fetching shifts', description: error.message, variant: 'destructive' });
                } else {
                    setShifts(data);
                }
                setLoading(false);
            };
            fetchShifts();
        }, [userId, toast]);
    
        const upcomingShifts = shifts.filter(s => isFuture(parseISO(s.start_time)));
        const pastShifts = shifts.filter(s => isPast(parseISO(s.start_time)));
    
        const renderShiftList = (shiftList, title) => (
            <Card>
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-24"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : shiftList.length > 0 ? (
                        <ul className="space-y-2">
                            {shiftList.map(shift => (
                                <li key={shift.id} className="p-2 rounded-md border text-sm">
                                    <p><strong>{format(parseISO(shift.start_time), 'PPP')}</strong></p>
                                    <p>{format(parseISO(shift.start_time), 'p')} - {format(parseISO(shift.end_time), 'p')}</p>
                                    {shift.notes && <p className="text-xs text-muted-foreground pt-1">Notes: {shift.notes}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center p-4">No {title.toLowerCase()}.</p>
                    )}
                </CardContent>
            </Card>
        );
    
        return (
            <div className="grid gap-6 md:grid-cols-2">
                {renderShiftList(upcomingShifts, 'Upcoming Shifts')}
                {renderShiftList(pastShifts, 'Past Shifts')}
            </div>
        );
    };

    const UserProfile = () => {
        const { profileId } = useParams();
        const navigate = useNavigate();
        const { toast } = useToast();
        const fileInputRef = useRef(null);

        const [profile, setProfile] = useState(null);
        const [roles, setRoles] = useState([]);
        const [locations, setLocations] = useState([]);
        const [loading, setLoading] = useState(true);
        const [uploading, setUploading] = useState(false);

        const [isEditOpen, setIsEditOpen] = useState(false);
        const [editedProfile, setEditedProfile] = useState(null);
        
        const fetchProfileData = useCallback(async () => {
            setLoading(true);
            const profilePromise = supabase.from('profiles').select('*, roles(*), locations(*)').eq('id', profileId).single();
            const rolesPromise = supabase.from('roles').select('*');
            const locationsPromise = supabase.from('locations').select('*');

            const [{ data: profileData, error: profileError }, { data: rolesData, error: rolesError }, { data: locationsData, error: locationsError }] = await Promise.all([profilePromise, rolesPromise, locationsPromise]);

            if (profileError) {
                toast({ title: 'Error fetching profile', description: profileError.message, variant: 'destructive' });
                navigate('/users-roles');
            } else {
                setProfile(profileData);
                setEditedProfile({
                    ...profileData,
                    start_date: profileData.start_date ? format(parseISO(profileData.start_date), 'yyyy-MM-dd') : ''
                });
            }
            if (rolesError) toast({ title: 'Error fetching roles', description: rolesError.message, variant: 'destructive' });
            else setRoles(rolesData || []);
            if (locationsError) toast({ title: 'Error fetching locations', description: locationsError.message, variant: 'destructive' });
            else setLocations(locationsData || []);

            setLoading(false);
        }, [profileId, toast, navigate]);


        useEffect(() => {
            fetchProfileData();
        }, [fetchProfileData]);

        const handleEditChange = (field, value) => {
            setEditedProfile(prev => ({ ...prev, [field]: value }));
        };

        const handleSave = async () => {
            const { id, user_id, updated_at, roles, locations, avatar_url, ...updateData } = editedProfile;
            
            if (updateData.start_date === '') {
                updateData.start_date = null;
            }

            const { error } = await supabase.from('profiles').update(updateData).eq('id', profile.id);

            if (error) {
                toast({ title: 'Error updating profile', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: 'User profile updated.' });
                setIsEditOpen(false);
                fetchProfileData();
            }
        };
        
        const getInitials = (name) => {
            if (!name) return '';
            const names = name.split(' ');
            return names.map(n => n[0]).join('').toUpperCase();
        };

        const handleAvatarClick = () => {
            fileInputRef.current.click();
        };

        const handleAvatarUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.user_id}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
                setUploading(false);
                return;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: `${data.publicUrl}?t=${new Date().getTime()}` })
                .eq('id', profile.id);

            if (updateError) {
                toast({ title: 'Failed to update profile', description: updateError.message, variant: 'destructive' });
            } else {
                toast({ title: 'Avatar updated!', description: 'Your new picture has been saved.' });
                fetchProfileData();
            }
            setUploading(false);
        };

        if (loading) {
            return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        }

        if (!profile) {
            return (
                <div className="flex-1 flex items-center justify-center p-8">
                    <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <CardTitle>User Not Found</CardTitle>
                            <CardDescription>We couldn't find a user with that ID.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link to="/users-roles"><ChevronLeft className="mr-2 h-4 w-4" /> Go Back to Users</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <>
                <Helmet><title>{profile.full_name}'s Profile - PetSuite</title><meta name="description" content={`Profile page for ${profile.full_name}.`} /></Helmet>
                <motion.div className="flex-1 space-y-6 p-8 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="flex items-center justify-between">
                        <Button asChild variant="outline"><Link to="/users-roles"><ChevronLeft className="mr-2 h-4 w-4" />Back to All Users</Link></Button>
                        <div className="flex items-center gap-2">
                            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}><DialogTrigger asChild><Button><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button></DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader><DialogTitle>Edit Profile</DialogTitle><DialogDescription>Update contract and role details for {profile.full_name}.</DialogDescription></DialogHeader>
                                    {editedProfile && <div className="grid grid-cols-2 gap-4 py-4">
                                        <div className="space-y-2"><Label htmlFor="role_id">Role</Label><Select value={editedProfile.role_id || ''} onValueChange={(value) => handleEditChange('role_id', value)}><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger><SelectContent>{roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="space-y-2"><Label htmlFor="location_id">Location</Label><Select value={editedProfile.location_id || ''} onValueChange={(value) => handleEditChange('location_id', value)}><SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger><SelectContent>{locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="col-span-2"><Separator className="my-2" /></div>
                                        <div className="space-y-2"><Label htmlFor="contract_type">Contract Type</Label><Select value={editedProfile.contract_type || ''} onValueChange={(value) => handleEditChange('contract_type', value)}><SelectTrigger><SelectValue placeholder="Select contract type" /></SelectTrigger><SelectContent><SelectItem value="Full-time">Full-time</SelectItem><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Contractor">Contractor</SelectItem></SelectContent></Select></div>
                                        <div className="space-y-2"><Label htmlFor="weekly_hours">Weekly Hours</Label><Input id="weekly_hours" type="number" value={editedProfile.weekly_hours || ''} onChange={(e) => handleEditChange('weekly_hours', e.target.value ? parseInt(e.target.value, 10) : null)} /></div>
                                        <div className="col-span-2 space-y-2"><Label htmlFor="start_date">Start Date</Label><Input id="start_date" type="date" value={editedProfile.start_date || ''} onChange={(e) => handleEditChange('start_date', e.target.value)} /></div>
                                        <div className="col-span-2 flex items-center space-x-2"><Checkbox id="terms_signed" checked={editedProfile.terms_signed} onCheckedChange={(checked) => handleEditChange('terms_signed', checked)} /><Label htmlFor="terms_signed">Terms & Conditions Signed</Label></div>
                                    </div>}
                                    <DialogFooter><Button onClick={handleSave}>Save Changes</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 text-3xl cursor-pointer" onClick={handleAvatarClick}>
                                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                                    <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleAvatarClick}>
                                    {uploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Upload className="h-6 w-6 text-white" />}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                                <div className="mt-3 flex items-center justify-center md:justify-start gap-4 flex-wrap">
                                    <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><Badge variant={roleColors[profile.roles?.name] || 'default'}>{profile.roles?.name || 'N/A'}</Badge></div>
                                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{profile.locations?.name || 'N/A'}</span></div>
                                    <div className="flex items-center gap-2" title={profile.terms_signed ? "Terms signed" : "Terms not signed"}>
                                        <CheckSquare className={`h-4 w-4 ${profile.terms_signed ? 'text-green-500' : 'text-muted-foreground'}`} />
                                        <span className="text-sm">{profile.terms_signed ? "Terms Signed" : "Awaiting Signature"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="overview">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="shifts">Shifts</TabsTrigger>
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-6 mt-6">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Employment Details</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <p><span className="font-semibold">Contract:</span> {profile.contract_type || 'N/A'}</p>
                                        <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {profile.weekly_hours ? `${profile.weekly_hours} hours / week` : 'N/A'}</p>
                                        <p className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /> Start Date: {profile.start_date ? format(parseISO(profile.start_date), "PPP") : 'N/A'}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Recent Activity</CardTitle></CardHeader>
                                    <CardContent><RecentActivity userId={profile.user_id} fullName={profile.full_name} /></CardContent>
                                </Card>
                                <Card className="lg:col-span-1 md:col-span-2">
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />System Details</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <p><span className="font-semibold">Profile ID:</span> <span className="text-xs text-muted-foreground">{profile.id}</span></p>
                                        <p><span className="font-semibold">User ID:</span> <span className="text-xs text-muted-foreground">{profile.user_id}</span></p>
                                        <p><span className="font-semibold">Last Updated:</span> {format(parseISO(profile.updated_at), "PPP, p")}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="shifts" className="mt-6">
                           <ShiftsTab userId={profile.user_id} />
                        </TabsContent>
                        <TabsContent value="tasks" className="mt-6">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" />All Tasks</CardTitle></CardHeader>
                                <CardContent className="text-center text-muted-foreground p-8">Full task list coming soon!</CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="settings" className="mt-6">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />User Settings</CardTitle></CardHeader>
                                <CardContent className="text-center text-muted-foreground p-8">User-specific settings coming soon!</CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </>
        );
    };

    export default UserProfile;