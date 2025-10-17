
    import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { PlusCircle, Loader2, MapPin, User, Clock, Building, Repeat } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { useLocation } from '@/contexts/LocationContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
    import { format, isPast, isToday, isTomorrow } from 'date-fns';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useUser } from '@/contexts/UserContext';
    
    
    const TaskCard = ({ task, index }) => {
        const getDueDateLabel = (dueDate) => {
            const date = new Date(dueDate);
            if (isToday(date)) return "Today";
            if (isTomorrow(date)) return "Tomorrow";
            if (isPast(date)) return "Overdue";
            return format(date, "MMM d");
        };
    
        const dueDateLabel = task.is_recurring ? 'Daily' : getDueDateLabel(task.due_date);
        const isOverdue = !task.is_recurring && isPast(new Date(task.due_date));
    
        return (
            <Draggable draggableId={task.id.toString()} index={index}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`mb-3 p-3 bg-card rounded-lg border shadow-sm ${snapshot.isDragging ? 'bg-muted' : ''}`}
                    >
                        <div className="flex justify-between items-start">
                            <p className="font-semibold text-sm mb-2 pr-2">{task.title}</p>
                            {task.is_recurring && <Repeat className="h-4 w-4 text-muted-foreground" title="Recurring Task" />}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            {task.rooms && (
                                <div className="flex items-center gap-1.5">
                                    <Building className="h-3 w-3" />
                                    <span>{task.rooms.name}</span>
                                </div>
                            )}
                            {task.assigned_to_profile && (
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3 w-3" />
                                    <span>{task.assigned_to_profile.full_name || 'Unassigned'}</span>
                                </div>
                            )}
                            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-destructive font-semibold' : ''}`}>
                                <Clock className="h-3 w-3" />
                                <span>{dueDateLabel}{!task.is_recurring && ` at ${format(new Date(task.due_date), "h:mm a")}`}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Draggable>
        );
    };
    
    const TaskColumn = ({ column, tasks }) => {
        return (
            <div className="flex-1 bg-muted/50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4 text-center">{column.title}</h2>
                <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[500px] transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                        >
                            {tasks.map((task, index) => (
                                <TaskCard key={task.id} task={task} index={index} />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        );
    };
    
    const AddTaskDialog = ({ open, onOpenChange, onTaskAdded }) => {
        const { toast } = useToast();
        const { selectedLocation } = useLocation();
        const { profile } = useUser();
        const [title, setTitle] = useState('');
        const [description, setDescription] = useState('');
        const [taskType, setTaskType] = useState('General');
        const [roomId, setRoomId] = useState('');
        const [assignedTo, setAssignedTo] = useState(null);
        const [dueDate, setDueDate] = useState('');
        const [dueTime, setDueTime] = useState('');
        const [isRecurring, setIsRecurring] = useState(false);
        const [staff, setStaff] = useState([]);
        const [rooms, setRooms] = useState([]);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [taskTemplates, setTaskTemplates] = useState([]);
        const [selectedTemplate, setSelectedTemplate] = useState('');
    
        useEffect(() => {
            if (selectedLocation && open) {
                const fetchInitialData = async () => {
                    const { data: staffData, error: staffError } = await supabase
                        .from('profiles')
                        .select('user_id, full_name')
                        .eq('location_id', selectedLocation.id);
    
                    if (staffError) toast({ title: 'Error fetching staff', description: staffError.message, variant: 'destructive' });
                    else setStaff(staffData);
    
                    const { data: roomsData, error: roomsError } = await supabase
                        .from('rooms')
                        .select('id, name')
                        .eq('location_id', selectedLocation.id);
                    
                    if (roomsError) toast({ title: 'Error fetching rooms', description: roomsError.message, variant: 'destructive' });
                    else setRooms(roomsData);

                    const { data: templatesData, error: templatesError } = await supabase
                        .from('task_templates')
                        .select('*')
                        .eq('location_id', selectedLocation.id)
                        .eq('is_enabled', true);

                    if (templatesError) toast({ title: 'Error fetching task templates', description: templatesError.message, variant: 'destructive' });
                    else setTaskTemplates(templatesData);
                };
                fetchInitialData();
            }
        }, [selectedLocation, open, toast]);

        useEffect(() => {
            if (selectedTemplate) {
                const template = taskTemplates.find(t => t.id === selectedTemplate);
                if (template) {
                    setTitle(template.title);
                    setDescription(template.description || '');
                    setTaskType(template.task_type);
                    setIsRecurring(template.days_of_week && template.days_of_week.length > 0);
                }
            } else {
                 resetForm(false);
            }
        }, [selectedTemplate, taskTemplates]);
        
        const resetForm = (fullReset = true) => {
            if (fullReset) setSelectedTemplate('');
            setTitle('');
            setDescription('');
            setTaskType('General');
            setRoomId('');
            setAssignedTo(null);
            setDueDate('');
            setDueTime('');
            setIsRecurring(false);
        };
    
        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!title || (!isRecurring && (!dueDate || !dueTime))) {
                toast({ title: 'Missing Information', description: 'Please fill out all required fields.', variant: 'destructive' });
                return;
            }
    
            setIsSubmitting(true);
            const dueDateTime = isRecurring ? null : `${dueDate}T${dueTime}:00`;
    
            const { data: newTask, error } = await supabase
                .from('tasks')
                .insert({
                    location_id: selectedLocation.id,
                    created_by: profile.user_id,
                    title,
                    description,
                    task_type: taskType,
                    room_id: taskType === 'Room-based' ? roomId : null,
                    assigned_to: assignedTo,
                    due_date: dueDateTime,
                    status: 'To Do',
                    time_of_day: dueDateTime ? (new Date(dueDateTime).getHours() < 12 ? 'Morning' : 'Afternoon') : null,
                    is_recurring: isRecurring,
                })
                .select('*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name), rooms(name)')
                .single();
    
            if (error) {
                toast({ title: 'Error creating task', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Task Created!', description: `"${title}" has been added.` });
                onTaskAdded(newTask);
                resetForm();
                onOpenChange(false);
            }
            setIsSubmitting(false);
        };
    
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Task</DialogTitle>
                        <DialogDescription>Fill in the details or select a template to create a new task.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="template" className="text-right">Template</Label>
                                <Select onValueChange={setSelectedTemplate} value={selectedTemplate}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Create from template..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None (Custom Task)</SelectItem>
                                        {taskTemplates.map(template => (
                                            <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">Title*</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" required disabled={!!selectedTemplate}/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" disabled={!!selectedTemplate}/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="task-type" className="text-right">Type</Label>
                                <Select onValueChange={setTaskType} value={taskType} disabled={!!selectedTemplate}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select task type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General">General</SelectItem>
                                        <SelectItem value="Room-based">Room-based</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {taskType === 'Room-based' && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="room" className="text-right">Room*</Label>
                                    <Select onValueChange={setRoomId} value={roomId}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a room" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rooms.map(room => (
                                                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="assigned-to" className="text-right">Assign To</Label>
                                <Select onValueChange={setAssignedTo} value={assignedTo || ''}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Unassigned</SelectItem>
                                        {staff.map(member => (
                                            <SelectItem key={member.user_id} value={member.user_id}>{member.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {!isRecurring && (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="due-date" className="text-right">Due Date*</Label>
                                        <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="col-span-3" required={!isRecurring} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="due-time" className="text-right">Due Time*</Label>
                                        <Input id="due-time" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="col-span-3" required={!isRecurring} />
                                    </div>
                                </>
                            )}
                            {isRecurring && (
                                <div className="text-center text-sm text-muted-foreground col-span-4 mt-2">
                                  This recurring task will be generated based on its template schedule.
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" onClick={() => resetForm()}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Task
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        );
    };
    
    
    const Tasks = () => {
        const { toast } = useToast();
        const { selectedLocation } = useLocation();
        const [loading, setLoading] = useState(true);
        const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    
        const initialColumns = {
            'todo': { id: 'todo', title: 'To Do', tasks: [] },
            'inprogress': { id: 'inprogress', title: 'In Progress', tasks: [] },
            'done': { id: 'done', title: 'Done', tasks: [] },
        };
        const [columns, setColumns] = useState(initialColumns);
    
        const fetchTasks = useCallback(async () => {
            if (!selectedLocation) {
                setLoading(false);
                setColumns(initialColumns);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from('tasks')
                .select('*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name), rooms(name)')
                .eq('location_id', selectedLocation.id)
                .order('due_date', { ascending: true, nullsFirst: false });
    
            if (error) {
                toast({ title: 'Error fetching tasks', description: error.message, variant: 'destructive' });
            } else {
                const newColumns = { todo: { ...initialColumns.todo, tasks: [] }, inprogress: { ...initialColumns.inprogress, tasks: [] }, done: { ...initialColumns.done, tasks: [] } };
    
                data.forEach(task => {
                    const statusKey = task.status.toLowerCase().replace(' ', '');
                    if (newColumns[statusKey]) {
                        newColumns[statusKey].tasks.push(task);
                    }
                });
                setColumns(newColumns);
            }
            setLoading(false);
        }, [selectedLocation, toast]);
    
        useEffect(() => {
            fetchTasks();
        }, [fetchTasks]);
    
        const handleTaskAdded = (newTask) => {
            setColumns(prevColumns => {
                const newTodoTasks = [...prevColumns.todo.tasks, newTask];
                newTodoTasks.sort((a, b) => {
                    if (a.is_recurring && !b.is_recurring) return -1;
                    if (!a.is_recurring && b.is_recurring) return 1;
                    return new Date(a.due_date) - new Date(b.due_date);
                });
                return {
                    ...prevColumns,
                    todo: {
                        ...prevColumns.todo,
                        tasks: newTodoTasks,
                    },
                };
            });
        };
        
        const handleOnDragEnd = async (result) => {
            const { destination, source, draggableId } = result;
    
            if (!destination) return;
            if (destination.droppableId === source.droppableId && destination.index === source.index) return;
            
            const startColumnKey = source.droppableId;
            const finishColumnKey = destination.droppableId;
    
            const startColumn = columns[startColumnKey];
            const finishColumn = columns[finishColumnKey];
            
            const startTasks = Array.from(startColumn.tasks);
            const [movedTask] = startTasks.splice(source.index, 1);
            
            const newStartColumn = { ...startColumn, tasks: startTasks };
            
            let newFinishColumn;
            
            if(startColumn.id === finishColumn.id) {
                const newTasks = startTasks;
                newTasks.splice(destination.index, 0, movedTask);
                newFinishColumn = { ...startColumn, tasks: newTasks };
            } else {
                const finishTasks = Array.from(finishColumn.tasks);
                finishTasks.splice(destination.index, 0, movedTask);
                newFinishColumn = { ...finishColumn, tasks: finishTasks };
            }
    
            const newColumns = {
                ...columns,
                [newStartColumn.id]: newStartColumn,
                [newFinishColumn.id]: newFinishColumn
            };
    
            setColumns(newColumns);
            
            const newStatus = finishColumn.title;
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', draggableId);
            
            if (error) {
                toast({ title: 'Error updating task', description: error.message, variant: 'destructive' });
                fetchTasks();
            } else {
                toast({ title: 'Task Updated!', description: `Task moved to "${newStatus}".`});
            }
        };
    
    
        return (
            <>
                <Helmet>
                    <title>Tasks - PetSuite</title>
                    <meta name="description" content="Manage daily tasks for your facility." />
                </Helmet>
                <motion.div
                    className="flex-1 space-y-4 p-8 pt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                        <Button onClick={() => setIsAddTaskOpen(true)} disabled={!selectedLocation}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                        </Button>
                    </div>
    
                    <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} onTaskAdded={handleTaskAdded} />
    
                    {!selectedLocation ? (
                        <Card className="flex flex-col items-center justify-center p-12 mt-8">
                            <MapPin className="h-12 w-12 text-muted-foreground mb-4"/>
                            <CardTitle>No Location Selected</CardTitle>
                            <CardContent className="text-center p-0 pt-2"><p>Please select a location to manage tasks.</p></CardContent>
                        </Card>
                    ) : loading ? (
                        <div className="flex justify-center items-center h-96">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            <div className="flex gap-6 mt-4">
                                <TaskColumn column={columns.todo} tasks={columns.todo.tasks} />
                                <TaskColumn column={columns.inprogress} tasks={columns.inprogress.tasks} />
                                <TaskColumn column={columns.done} tasks={columns.done.tasks} />
                            </div>
                        </DragDropContext>
                    )}
                </motion.div>
            </>
        );
    };
    
    export default Tasks;
  