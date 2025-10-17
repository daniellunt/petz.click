import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, Plus, Trash2, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilitySettings = () => {
  const { selectedLocation } = useLocation();
  const { toast } = useToast();
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!selectedLocation) return;
    setLoadingStaff(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, availability')
      .eq('location_id', selectedLocation.id);

    if (error) {
      toast({ title: 'Error fetching staff', description: error.message, variant: 'destructive' });
    } else {
      setStaffList(data);
    }
    setLoadingStaff(false);
  }, [selectedLocation, toast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    if (selectedStaff) {
      setLoadingAvailability(true);
      const staffMember = staffList.find(s => s.user_id === selectedStaff);
      if (staffMember && staffMember.availability) {
        setAvailability(staffMember.availability);
      } else {
        const newAvailability = daysOfWeek.reduce((acc, day) => {
          acc[day.toLowerCase()] = [];
          return acc;
        }, {});
        setAvailability(newAvailability);
      }
      setLoadingAvailability(false);
    } else {
      setAvailability(null);
    }
  }, [selectedStaff, staffList]);

  const handleTimeChange = (day, index, field, value) => {
    const newAvailability = { ...availability };
    newAvailability[day][index][field] = value;
    setAvailability(newAvailability);
  };

  const addTimeSlot = (day) => {
    const newAvailability = { ...availability };
    if (!newAvailability[day]) {
      newAvailability[day] = [];
    }
    newAvailability[day].push({ start: '09:00', end: '17:00' });
    setAvailability(newAvailability);
  };

  const removeTimeSlot = (day, index) => {
    const newAvailability = { ...availability };
    newAvailability[day].splice(index, 1);
    setAvailability(newAvailability);
  };

  const handleSave = async () => {
    if (!selectedStaff || !availability) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ availability })
      .eq('user_id', selectedStaff);

    if (error) {
      toast({ title: 'Error saving availability', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Availability Saved!', description: 'Staff availability has been updated.' });
      fetchStaff();
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Availability</CardTitle>
        <CardDescription>Set the weekly availability for your staff members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Select onValueChange={setSelectedStaff} value={selectedStaff || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select a staff member" />
            </SelectTrigger>
            <SelectContent>
              {loadingStaff ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                staffList.map(staff => (
                  <SelectItem key={staff.user_id} value={staff.user_id}>
                    {staff.full_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedStaff && (
          loadingAvailability ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {daysOfWeek.map(day => {
                const dayKey = day.toLowerCase();
                return (
                  <div key={day} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{day}</h3>
                      <Button variant="outline" size="sm" onClick={() => addTimeSlot(dayKey)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Slot
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {availability && availability[dayKey] && availability[dayKey].length > 0 ? (
                        availability[dayKey].map((slot, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => handleTimeChange(dayKey, index, 'start', e.target.value)}
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => handleTimeChange(dayKey, index, 'end', e.target.value)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(dayKey, index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Unavailable</p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Availability
                </Button>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilitySettings;
  