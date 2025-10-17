import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Edit, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parse } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ShiftManagement = () => {
  const { selectedLocation } = useLocation();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  const fetchTemplates = useCallback(async () => {
    if (!selectedLocation) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*')
      .eq('location_id', selectedLocation.id)
      .order('name', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching shift templates', description: error.message, variant: 'destructive' });
    } else {
      setTemplates(data);
    }
    setLoading(false);
  }, [selectedLocation, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenDialog = (template = null) => {
    if (template) {
      setCurrentTemplate({
        id: template.id,
        name: template.name,
        start_time: template.start_time,
        end_time: template.end_time,
        days_of_week: Array.isArray(template.days_of_week) ? template.days_of_week : [],
      });
    } else {
      setCurrentTemplate({ id: null, name: '', start_time: '09:00', end_time: '17:00', days_of_week: [] });
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
    if (!selectedLocation || !currentTemplate || !currentTemplate.name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const dataToSave = {
      location_id: selectedLocation.id,
      name: currentTemplate.name,
      start_time: currentTemplate.start_time,
      end_time: currentTemplate.end_time,
      days_of_week: currentTemplate.days_of_week,
    };

    let error;
    if (currentTemplate.id) {
      ({ error } = await supabase.from('shift_templates').update(dataToSave).eq('id', currentTemplate.id));
    } else {
      ({ error } = await supabase.from('shift_templates').insert(dataToSave));
    }
    
    if (error) {
      toast({ title: 'Error saving template', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Template Saved!', description: 'The shift template has been saved successfully.' });
      setIsDialogOpen(false);
      fetchTemplates();
    }
    setIsSaving(false);
  };

  const handleDelete = async (templateId) => {
     if(!window.confirm("Are you sure you want to delete this template? This cannot be undone.")) return;

    const { error } = await supabase.from('shift_templates').delete().eq('id', templateId);
    if (error) {
      toast({ title: 'Error deleting template', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Template Deleted', description: 'The shift template has been removed.' });
      fetchTemplates();
    }
  };

  const formatTime = (timeString) => {
    try {
      const date = parse(timeString, 'HH:mm:ss', new Date());
      return format(date, 'p');
    } catch {
      return timeString;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Shift Templates</CardTitle>
            <CardDescription>Create and manage reusable shift templates for quick scheduling.</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Add Template
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No shift templates found. Get started by creating one!</div>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {templates.map(template => (
                        <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/> {formatTime(template.start_time)} - {formatTime(template.end_time)}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {(template.days_of_week || []).map(day => <Badge key={day} variant="secondary" className="capitalize">{day.substring(0,3)}</Badge>)}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
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
                    <DialogTitle>{currentTemplate?.id ? 'Edit Shift Template' : 'Create New Shift Template'}</DialogTitle>
                </DialogHeader>
                {currentTemplate && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Template Name</Label>
                            <Input id="name" value={currentTemplate.name} onChange={(e) => setCurrentTemplate(p => ({...p, name: e.target.value}))} placeholder="e.g., Morning Shift"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="start_time">Start Time</Label><Input id="start_time" type="time" value={currentTemplate.start_time} onChange={(e) => setCurrentTemplate(p => ({...p, start_time: e.target.value}))}/></div>
                            <div><Label htmlFor="end_time">End Time</Label><Input id="end_time" type="time" value={currentTemplate.end_time} onChange={(e) => setCurrentTemplate(p => ({...p, end_time: e.target.value}))}/></div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Days of the Week</Label>
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
  );
};

export default ShiftManagement;
