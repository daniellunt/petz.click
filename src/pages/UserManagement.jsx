
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, PlusCircle, Edit, Trash2, Loader2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from '@/contexts/LocationContext';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const roleColors = {
    Admin: 'destructive',
    Manager: 'default',
    Staff: 'secondary',
};

const UserManagement = () => {
    const { toast } = useToast();
    const { locations } = useLocation();
    const { permissionsList } = useUser();
    const { signUp } = useAuth();

    const [profiles, setProfiles] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [isSubmittingUser, setIsSubmittingUser] = useState(false);

    const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
    const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    
    const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role_id: '', location_id: '' });

    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');

    const [editingRole, setEditingRole] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const fetchProfilesAndRoles = useCallback(async () => {
        setLoadingProfiles(true);
        setLoadingRoles(true);

        const profilesPromise = supabase.from('profiles').select('*, roles(name), locations(name)');
        const rolesPromise = supabase.from('roles').select('*, role_permissions(permission_id)');

        const [{ data: profilesData, error: profilesError }, { data: rolesData, error: rolesError }] = await Promise.all([profilesPromise, rolesPromise]);
        
        if (profilesError) toast({ title: 'Error fetching users', description: profilesError.message, variant: 'destructive' });
        else setProfiles(profilesData);
        setLoadingProfiles(false);
        
        if (rolesError) toast({ title: 'Error fetching roles', description: rolesError.message, variant: 'destructive' });
        else {
            const formattedRoles = rolesData.map(role => ({
                ...role,
                permissions: role.role_permissions.map(rp => rp.permission_id)
            }));
            setRoles(formattedRoles);
        }
        setLoadingRoles(false);
    }, [toast]);

    useEffect(() => {
        fetchProfilesAndRoles();
    }, [fetchProfilesAndRoles]);

    const handleInviteUser = async () => {
        if (!newUser.full_name || !newUser.email || !newUser.password || !newUser.role_id || !newUser.location_id) {
            toast({ title: "Error", description: "Please fill all user fields.", variant: "destructive" });
            return;
        }

        setIsSubmittingUser(true);
        const { error } = await signUp(newUser.email, newUser.password, {
             data: {
                full_name: newUser.full_name,
                role_id: newUser.role_id,
                location_id: newUser.location_id,
            }
        });
        
        if (error) {
            toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: "Success!", description: `Confirmation email sent to "${newUser.email}".` });
            setNewUser({ full_name: '', email: '', password: '', role_id: '', location_id: '' });
            setIsInviteUserOpen(false);
            fetchProfilesAndRoles();
        }
        setIsSubmittingUser(false);
    };
    
    const handleAddRole = async () => {
        if (!newRoleName) {
            toast({ title: "Error", description: "Role name cannot be empty.", variant: "destructive" });
            return;
        }
        const { error } = await supabase.from('roles').insert([{ name: newRoleName, description: newRoleDescription }]);
        if(error) {
            toast({ title: "Error creating role", description: error.message, variant: 'destructive' });
        } else {
            toast({ title: "Success!", description: `Role "${newRoleName}" has been created.` });
            setNewRoleName('');
            setNewRoleDescription('');
            setIsAddRoleOpen(false);
            fetchProfilesAndRoles();
        }
    };

    const handleEditRoleClick = (role) => {
        setEditingRole(role);
        setNewRoleName(role.name);
        setNewRoleDescription(role.description);
        setSelectedPermissions(role.permissions);
        setIsEditRoleOpen(true);
    };

    const handleUpdateRole = async () => {
        if (!newRoleName) {
            toast({ title: "Error", description: "Role name cannot be empty.", variant: "destructive" });
            return;
        }

        const { error: updateError } = await supabase.from('roles').update({ name: newRoleName, description: newRoleDescription }).eq('id', editingRole.id);
        if(updateError) {
             toast({ title: "Error updating role", description: updateError.message, variant: 'destructive' });
             return;
        }

        await supabase.from('role_permissions').delete().eq('role_id', editingRole.id);

        if (selectedPermissions.length > 0) {
            const newPerms = selectedPermissions.map(pId => ({ role_id: editingRole.id, permission_id: pId }));
            const { error: insertPermsError } = await supabase.from('role_permissions').insert(newPerms);
            if(insertPermsError) {
                toast({ title: "Error setting new permissions", description: insertPermsError.message, variant: 'destructive' });
                return;
            }
        }
        
        toast({ title: "Success!", description: `Role "${newRoleName}" has been updated.` });
        setEditingRole(null);
        setIsEditRoleOpen(false);
        fetchProfilesAndRoles();
    };

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        
        const { error } = await supabase.from('roles').delete().eq('id', roleToDelete.id);
        
        if (error) {
            toast({ title: "Error deleting role", description: error.message, variant: 'destructive' });
        } else {
            toast({ title: "Success!", description: `Role "${roleToDelete.name}" has been deleted.` });
            fetchProfilesAndRoles();
        }
        setRoleToDelete(null);
    };

    const handlePermissionChange = (permissionId) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId) 
            ? prev.filter(p => p !== permissionId) 
            : [...prev, permissionId]
        );
    };
    
    const handleNotImplemented = () => {
        toast({
            title: "Feature Coming Soon!",
            description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
            variant: "destructive",
        });
    };

    return (
        <>
            <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-end">
                    <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>A confirmation email will be sent to them to set up their account.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="full_name" className="text-right">Full Name</Label><Input id="full_name" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} className="col-span-3" /></div>
                                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="col-span-3" /></div>
                                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="password" className="text-right">Password</Label><Input id="password" type="password" placeholder="Set a temporary password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="col-span-3" /></div>
                                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="role" className="text-right">Role</Label><Select onValueChange={(v) => setNewUser({...newUser, role_id: v})} value={newUser.role_id}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a role" /></SelectTrigger><SelectContent>{roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="location" className="text-right">Location</Label><Select onValueChange={(v) => setNewUser({...newUser, location_id: v})} value={newUser.location_id}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a location" /></SelectTrigger><SelectContent>{locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <DialogFooter><Button type="submit" onClick={handleInviteUser} disabled={isSubmittingUser}>{isSubmittingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create User</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Tabs defaultValue="users">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Users</TabsTrigger>
                        <TabsTrigger value="roles"><Shield className="mr-2 h-4 w-4" /> Roles</TabsTrigger>
                    </TabsList>
                    <TabsContent value="users">
                        <Card>
                            <CardHeader><CardTitle>User Directory</CardTitle><CardDescription>Manage your team members and their account permissions.</CardDescription></CardHeader>
                            <CardContent>
                                {loadingProfiles ? <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                                <Table>
                                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {profiles.map(profile => (
                                            <TableRow key={profile.id}>
                                                <TableCell className="font-medium"><Link to={`/users/${profile.id}`} className="hover:underline text-primary">{profile.full_name}</Link></TableCell>
                                                <TableCell><Badge variant={roleColors[profile.roles?.name] || 'default'}>{profile.roles?.name || 'N/A'}</Badge></TableCell>
                                                <TableCell>{profile.locations?.name || 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="ghost" size="icon"><Link to={`/users/${profile.id}`}><Edit className="h-4 w-4" /></Link></Button>
                                                    <Button variant="ghost" size="icon" onClick={handleNotImplemented}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="roles">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div><CardTitle>Roles</CardTitle><CardDescription>Define roles to group permissions for your users.</CardDescription></div>
                                <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}><DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Role</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Add New Role</DialogTitle><DialogDescription>Create a new role and define its purpose.</DialogDescription></DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="role-name" className="text-right">Name</Label><Input id="role-name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="col-span-3" /></div>
                                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="role-desc" className="text-right">Description</Label><Input id="role-desc" value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} className="col-span-3" /></div>
                                        </div>
                                        <DialogFooter><Button type="submit" onClick={handleAddRole}>Save Role</Button></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {loadingRoles ? <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                                    <div className="space-y-4">
                                    {roles.map(role => (
                                        <div key={role.id} className="flex flex-col p-4 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div><p className="font-medium">{role.name}</p><p className="text-sm text-muted-foreground">{role.description}</p></div>
                                                <div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={() => handleEditRoleClick(role)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setRoleToDelete(role)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                                            </div>
                                            {role.permissions.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium mb-2">Permissions:</p>
                                                    <div className="flex flex-wrap gap-2">{role.permissions.map(pId => {const perm = permissionsList.find(p => p.id === pId); return perm ? <Badge key={pId} variant="secondary">{perm.label}</Badge> : null;})}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    </div>
                                }
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader><DialogTitle>Edit Role</DialogTitle><DialogDescription>Update the details for the "{editingRole?.name}" role.</DialogDescription></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-role-name" className="text-right">Name</Label><Input id="edit-role-name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-role-desc" className="text-right">Description</Label><Input id="edit-role-desc" value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} className="col-span-3" /></div>
                            <div className="col-span-4">
                                <Label className="text-sm font-medium">Permissions</Label>
                                <div className="mt-2 grid grid-cols-2 gap-4 rounded-md border p-4 max-h-[200px] overflow-y-auto">{permissionsList.map(permission => (<div key={permission.id} className="flex items-center space-x-2"><Checkbox id={`edit-${permission.id}`} checked={selectedPermissions.includes(permission.id)} onCheckedChange={() => handlePermissionChange(permission.id)} /><label htmlFor={`edit-${permission.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{permission.label}</label></div>))}</div>
                            </div>
                        </div>
                        <DialogFooter><Button type="submit" onClick={handleUpdateRole}>Save Changes</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the "{roleToDelete?.name}" role.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteRole}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
            </motion.div>
        </>
    );
};

export default UserManagement;
