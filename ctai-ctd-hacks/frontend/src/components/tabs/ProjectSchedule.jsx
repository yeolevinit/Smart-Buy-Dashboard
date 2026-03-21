import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  format, differenceInDays, isAfter, isBefore,
  parseISO, isValid, addDays
} from "date-fns";
import {
  CheckCircle, Clock, Calendar, TrendingUp,
  AlertCircle, Edit3, Save, X, Plus, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Local mock procurement items (mirrored from mockData for Gantt overlay)
const MOCK_PROCUREMENT_ITEMS = [
  {
    id: '1', material: 'Structural Steel',
    orderBy: new Date('2025-08-25'), deliveryStart: new Date('2025-09-10'),
    deliveryEnd: new Date('2025-09-25'), status: 'critical', vendor: 'Tata Steel Ltd.',
  },
  {
    id: '2', material: 'Concrete (M40)',
    orderBy: new Date('2025-09-05'), deliveryStart: new Date('2025-09-20'),
    deliveryEnd: new Date('2025-10-05'), status: 'on-track', vendor: 'Ultratech Concrete Supplies',
  },
  {
    id: '3', material: 'Glass Curtain Wall',
    orderBy: new Date('2025-10-01'), deliveryStart: new Date('2025-10-20'),
    deliveryEnd: new Date('2025-11-05'), status: 'warning', vendor: 'Saint-Gobain Glass India',
  },
  {
    id: '4', material: 'HVAC Systems',
    orderBy: new Date('2025-11-10'), deliveryStart: new Date('2025-12-01'),
    deliveryEnd: new Date('2025-12-15'), status: 'on-track', vendor: 'Blue Star HVAC',
  },
];

// Helper to build a default task
function makeTask(id, name, phase, durationDays, startDate, finishDate, completion, notes, dependencies, status) {
  return {
    id,
    name,
    phase,
    duration: durationDays,
    startDate,
    finishDate,
    completion,
    notes,
    dependencies,
    status,
  };
}

export function ProjectSchedule({ project }) {
  const [viewMode] = useState('table');
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  // editBuffer stores the in-progress edit values keyed by task id
  const [editBuffer, setEditBuffer] = useState({});
  const { toast } = useToast();

  // Initialise tasks once on mount
  useEffect(() => {
    setTasks([
      makeTask('task-1', 'Conceptual & Schematic Design', 'Design', 30,
        new Date('2025-01-01'), new Date('2025-01-31'), 0,
        'Architectural planning and initial design concepts', [], 'in-progress'),
      makeTask('task-2', 'Design Development', 'Design', 45,
        new Date('2025-02-01'), new Date('2025-03-17'), 0,
        'Detailed engineering drawings and specifications', ['task-1'], 'in-progress'),
      makeTask('task-3', 'Construction Documents (IFC)', 'Design', 30,
        new Date('2025-03-18'), new Date('2025-04-17'), 0,
        'Issued for Construction drawings and final specifications', ['task-2'], 'pending'),
      makeTask('task-4', 'Electrical Installation', 'Installation', 60,
        new Date('2025-12-01'), new Date('2026-01-30'), 0,
        'Electrical systems installation and testing', ['task-3'], 'pending'),
      makeTask('task-5', 'Mechanical Installation', 'Installation', 45,
        new Date('2025-12-15'), new Date('2026-01-29'), 0,
        'HVAC and mechanical systems installation', ['task-3'], 'pending'),
    ]);
  }, []);

  // ── Editing helpers ──────────────────────────────────────────────────────────

  const startEditing = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setEditBuffer(prev => ({
      ...prev,
      [taskId]: {
        name: task.name,
        phase: task.phase,
        duration: task.duration,
        startDate: format(task.startDate, 'yyyy-MM-dd'),
        finishDate: format(task.finishDate, 'yyyy-MM-dd'),
        completion: task.completion,
        notes: task.notes,
      },
    }));
    setEditingTask(taskId);
  };

  const cancelEditing = (taskId) => {
    setEditingTask(null);
    setEditBuffer(prev => { const n = { ...prev }; delete n[taskId]; return n; });
  };

  const updateBuffer = (taskId, field, value) => {
    setEditBuffer(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value },
    }));
  };

  const saveEditing = (taskId) => {
    const buf = editBuffer[taskId];
    if (!buf) return;

    const newStart = parseISO(buf.startDate);
    const newFinish = parseISO(buf.finishDate);

    if (!isValid(newStart) || !isValid(newFinish)) {
      toast({ title: "Invalid Date", description: "Please enter valid dates.", variant: "destructive" });
      return;
    }
    if (newFinish <= newStart) {
      toast({ title: "Invalid Date Range", description: "Finish must be after start.", variant: "destructive" });
      return;
    }

    const completion = Number(buf.completion) || 0;

    setTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t,
      name: buf.name,
      phase: buf.phase,
      duration: Number(buf.duration) || t.duration,
      startDate: newStart,
      finishDate: newFinish,
      completion,
      status: completion === 100 ? 'completed' : t.status,
      notes: buf.notes,
    }));

    setEditingTask(null);
    setEditBuffer(prev => { const n = { ...prev }; delete n[taskId]; return n; });
    const task = tasks.find(t => t.id === taskId);
    toast({ title: "Task Updated", description: `Schedule updated for ${task?.name}` });
  };

  const addNewTask = () => {
    const newId = `task-${Date.now()}`;
    const today = new Date();
    const newTask = makeTask(
      newId, 'New Task', 'Design', 30,
      today, addDays(today, 30), 0, '', [], 'pending'
    );
    setTasks(prev => [...prev, newTask]);
    startEditing(newId);
  };

  const deleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: "Task Deleted", description: `"${task?.name}" removed.` });
  };

  // ── Derived values ───────────────────────────────────────────────────────────

  const overallCompletion = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.completion, 0) / tasks.length)
    : 0;

  const targetDate = tasks.length
    ? format(new Date(Math.max(...tasks.map(t => t.finishDate.getTime()))), 'MMM yyyy')
    : 'N/A';

  const phaseList = ['Design', 'Development', 'Procurement', 'Installation'];

  // ── Status helpers ───────────────────────────────────────────────────────────

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };



  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="tab-content">
      {/* Header Controls */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Project Schedule</CardTitle>
              <CardDescription>Editable project timeline — click the pencil icon to update any task</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addNewTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{overallCompletion}%</span>
              </div>
              <Progress value={overallCompletion} className="h-3" />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{tasks.length}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{targetDate}</div>
                <div className="text-sm text-muted-foreground">Target Completion</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Summary */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Schedule Summary
          </CardTitle>
          <CardDescription>Overview by phase and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Phase Distribution</h4>
              <div className="space-y-3">
                {phaseList.map(phase => {
                  const phaseTasks = tasks.filter(t => t.phase === phase);
                  const done = phaseTasks.filter(t => t.status === 'completed').length;
                  const total = phaseTasks.length;
                  return (
                    <div key={phase} className="flex items-center justify-between">
                      <span className="text-sm">{phase}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={total > 0 ? (done / total) * 100 : 0} className="w-20 h-2" />
                        <span className="text-sm text-muted-foreground w-12">{done}/{total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Status Overview</h4>
              <div className="space-y-3">
                {[
                  { label: 'Completed', color: 'bg-green-100 text-green-800', status: 'completed' },
                  { label: 'In Progress', color: 'bg-blue-100 text-blue-800', status: 'in-progress' },
                  { label: 'Pending', color: 'bg-gray-100 text-gray-800', status: 'pending' },
                  { label: 'Blocked', color: 'bg-red-100 text-red-800', status: 'blocked' },
                ].map(({ label, color, status }) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <Badge className={color}>{tasks.filter(t => t.status === status).length}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Task Table */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Project Tasks</CardTitle>
          <CardDescription>Click the pencil icon on any row to edit dates, completion % or notes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {['Task Name', 'Phase', 'Duration', 'Start Date', 'Finish Date', 'Completion', 'Status', 'Notes', 'Actions']
                    .map(h => <th key={h} className="text-left p-3 font-medium text-sm">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => {
                  const isEditing = editingTask === task.id;
                  const buf = editBuffer[task.id] || {};

                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      {/* Name */}
                      <td className="p-3">
                        {isEditing
                          ? <Input value={buf.name ?? task.name}
                            onChange={e => updateBuffer(task.id, 'name', e.target.value)}
                            className="w-full" />
                          : <div className="font-medium">{task.name}</div>}
                      </td>

                      {/* Phase */}
                      <td className="p-3">
                        {isEditing
                          ? <Select value={buf.phase ?? task.phase}
                            onValueChange={v => updateBuffer(task.id, 'phase', v)}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['Design', 'Development', 'Procurement', 'Installation'].map(p =>
                                <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          : <Badge variant="outline">{task.phase}</Badge>}
                      </td>

                      {/* Duration */}
                      <td className="p-3">
                        {isEditing
                          ? <Input type="number" value={buf.duration ?? task.duration}
                            onChange={e => updateBuffer(task.id, 'duration', e.target.value)}
                            className="w-20" />
                          : <span>{task.duration} days</span>}
                      </td>

                      {/* Start Date */}
                      <td className="p-3">
                        {isEditing
                          ? <Input type="date" value={buf.startDate ?? format(task.startDate, 'yyyy-MM-dd')}
                            onChange={e => updateBuffer(task.id, 'startDate', e.target.value)}
                            className="w-36" />
                          : <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(task.startDate, 'MMM dd, yyyy')}
                          </div>}
                      </td>

                      {/* Finish Date */}
                      <td className="p-3">
                        {isEditing
                          ? <Input type="date" value={buf.finishDate ?? format(task.finishDate, 'yyyy-MM-dd')}
                            onChange={e => updateBuffer(task.id, 'finishDate', e.target.value)}
                            className="w-36" />
                          : <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(task.finishDate, 'MMM dd, yyyy')}
                          </div>}
                      </td>

                      {/* Completion % */}
                      <td className="p-3">
                        {isEditing
                          ? <div className="flex items-center gap-2">
                            <Input type="number" min="0" max="100"
                              value={buf.completion ?? task.completion}
                              onChange={e => updateBuffer(task.id, 'completion', parseInt(e.target.value) || 0)}
                              className="w-16" />
                            <span className="text-xs">%</span>
                          </div>
                          : <div className="flex items-center gap-2">
                            <Progress value={task.completion} className="w-16 h-2" />
                            <span className="text-sm">{task.completion}%</span>
                          </div>}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1 capitalize">{task.status.replace('-', ' ')}</span>
                        </Badge>
                      </td>

                      {/* Notes */}
                      <td className="p-3">
                        {isEditing
                          ? <Textarea value={buf.notes ?? task.notes}
                            onChange={e => updateBuffer(task.id, 'notes', e.target.value)}
                            className="w-48 h-16 text-xs" placeholder="Add notes..." />
                          : <div className="text-sm text-muted-foreground max-w-xs truncate">{task.notes}</div>}
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        {isEditing
                          ? <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => saveEditing(task.id)}
                              className="h-6 w-6 p-0">
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => cancelEditing(task.id)}
                              className="h-6 w-6 p-0">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          : <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => startEditing(task.id)}
                              className="h-6 w-6 p-0">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

}

