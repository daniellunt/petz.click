
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const TaskTemplates = () => {
  const { selectedLocation } = useLocation();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [rooms, setRooms] = useState([]);

  const fetchTemplatesAndRooms = useCallback(async () => {
    if (!selectedLocation) return;
    setLoading(true);
    const templatesPromise = supabase
      .from('task_templates')
      .select('*, rooms(name)')
      .eq('location_id', selectedLocation.id)
      .order('title', { ascending: true });
      
    const roomsPromise = supabase
      .from('rooms')
      .select('id, name')
      .eq('location_id', selectedLocation.id);

    const [{ data: templatesData, error: templatesError }, { data: roomsData, error: roomsError }] = await Promise.all([templatesPromise, roomsPromise]);

    if (templatesError) {
      toast({ title: 'Error fetching task templates', description: templatesError.message, variant: 'destructive' });
    } else {
      setTemplates(templatesData);
    }

    if (roomsError) {
      toast({ title: 'Error fetching rooms', description: roomsError.message, variant: 'destructive' });
    } else {
      setRooms(roomsData);
    }
    
    setLoading(false);
  }, [selectedLocation, toast]);

  useEffect(() => {
    fetchTemplatesAndRooms();
  }, [fetchTemplatesAndRooms]);

  const handleOpenDialog = (template = null) => {
    if (template) {
      setCurrentTemplate({
        ...template,
        room_id: template.room_id || 'none', // Use 'none' instead of empty string for SelectItem
        is_recurring: Array.isArray(template.days_of_week),
        days_of_week: Array.isArray(template.days_of_week) ? template.days_of_week : [],
       });
    } else {
      setCurrentTemplate({ id: null, title: '', description: '', task_type: 'General', is_enabled: true, is_recurring: false, days_of_week: [], room_id: 'none' }); // Use 'none'
    }
    setIsDialogOpen(true);
  };
  
  const handleDayToggle = (day) => {
    setCurrentTemplate(prev => {
      const newDays = prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day];
      return { ...prev, days_of_week: newDays };
    });
  };

  const handleSave = async () => {
    if (!selectedLocation || !currentTemplate || !currentTemplate.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (currentTemplate.task_type === 'Room-based' && currentTemplate.room_id === 'none') { // Check for 'none'
        toast({ title: "Room is required for Room-based tasks", variant: "destructive" });
        return;
    }
    setIsSaving(true);

    const dataToSave = {
      location_id: selectedLocation.id,
      title: currentTemplate.title,
      description: currentTemplate.description,
      task_type: currentTemplate.task_type,
      is_enabled: currentTemplate.is_enabled,
      days_of_week: currentTemplate.is_recurring ? currentTemplate.days_of_week : null,
      room_id: currentTemplate.task_type === 'Room-based' && currentTemplate.room_id !== 'none' ? currentTemplate.room_id : null, // Convert 'none' back to null for DB
    };

    let error;
    if (currentTemplate.id) {
      ({ error } = await supabase.from('task_templates').update(dataToSave).eq('id', currentTemplate.id));
    } else {
      ({ error } = await supabase.from('task_templates').insert(dataToSave));
    }
    
    if (error) {
      toast({ title: 'Error saving template', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Template Saved!', description: 'The task template has been saved successfully.' });
      setIsDialogOpen(false);
      fetchTemplatesAndRooms();
    }
    setIsSaving(false);
  };

  const handleDelete = async (templateId) => {
    const { error } = await supabase.from('task_templates').delete().eq('id', templateId);
    if (error) {
      toast({ title: 'Error deleting template', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Template Deleted', description: 'The task template has been removed.' });
      fetchTemplatesAndRooms();
    }
    setTemplateToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Task Templates</CardTitle>
              <CardDescription>Create and manage templates for recurring daily tasks.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Add Template
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
              <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No task templates found. Get started by creating one!</div>
          ) : (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Template Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Assigned Room</TableHead>
                          <TableHead>Recurring Days</TableHead>
                          <TableHead>Enabled</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {templates.map(template => (
                          <TableRow key={template.id}>
                              <TableCell className="font-medium">{template.title}</TableCell>
                              <TableCell>{template.task_type}</TableCell>
                              <TableCell>{template.rooms?.name || 'N/A'}</TableCell>
                              <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                      {(template.days_of_week || []).length > 0
                                          ? template.days_of_week.map(day => <Badge key={day} variant="secondary" className="capitalize">{day.substring(0,3)}</Badge>)
                                          : 'Not Recurring'
                                      }
                                  </div>
                              </TableCell>
                              <TableCell>{template.is_enabled ? 'Yes' : 'No'}</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}><Edit className="h-4 w-4"/></Button>
                                  <Button variant="ghost" size="icon" onClick={() => setTemplateToDelete(template)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          )}
        </CardContent>

         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{currentTemplate?.id ? 'Edit Task Template' : 'Create New Task Template'}</DialogTitle>
                  </DialogHeader>
                  {currentTemplate && (
                      <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                              <Label htmlFor="title">Template Title</Label>
                              <Input id="title" value={currentTemplate.title} onChange={(e) => setCurrentTemplate(p => ({...p, title: e.target.value}))} placeholder="e.g., Mop Floors"/>
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea id="description" value={currentTemplate.description} onChange={(e) => setCurrentTemplate(p => ({...p, description: e.target.value}))} placeholder="Optional details about the task."/>
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="task-type">Task Type</Label>
                              <Select value={currentTemplate.task_type} onValueChange={(value) => setCurrentTemplate(p => ({...p, task_type: value}))}>
                                  <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="General">General</SelectItem>
                                      <SelectItem value="Room-based">Room-based</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>

                          {currentTemplate.task_type === 'Room-based' && (
                            <div className="grid gap-2">
                              <Label htmlFor="room-id">Assign to Room</Label>
                              <Select value={currentTemplate.room_id} onValueChange={(value) => setCurrentTemplate(p => ({...p, room_id: value}))}>
                                <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem> {/* Changed value from "" to "none" */}
                                    {rooms.map(room => (
                                        <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 pt-2">
                              <Switch id="is_recurring" checked={currentTemplate.is_recurring} onCheckedChange={(checked) => setCurrentTemplate(p => ({...p, is_recurring: checked}))} />
                              <Label htmlFor="is_recurring">Set as Recurring Task</Label>
                          </div>

                          {currentTemplate.is_recurring && (
                              <div className="grid gap-2 pl-2">
                                  <Label>Recurring Days</Label>
                                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                                      {daysOfWeek.map(day => (
                                          <div key={day} className="flex items-center space-x-2">
                                              <Checkbox
                                                  id={day}
                                                  checked={currentTemplate.days_of_week.includes(day)}
                                                  onCheckedChange={() => handleDayToggle(day)}
                                              />
                                              <label htmlFor={day} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                                                  {day}
                                              </label>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                          <div className="flex items-center space-x-2 pt-4">
                              <Switch id="is_enabled" checked={currentTemplate.is_enabled} onCheckedChange={(checked) => setCurrentTemplate(p => ({...p, is_enabled: checked}))} />
                              <Label htmlFor="is_enabled">Enabled</Label>
                          </div>
                      </div>
                  )}
                  <DialogFooter>
                      <Button onClick={handleSave} disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {currentTemplate?.id ? 'Save Changes' : 'Create Template'}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </Card>

      {templateToDelete && (
          <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the "{templateToDelete.title}" template.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(templateToDelete.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      )}
    </>
  );
};

export default TaskTemplates;
