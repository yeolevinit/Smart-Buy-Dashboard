import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays, isAfter, isBefore, startOfDay, endOfDay, parseISO, isValid, addDays } from "date-fns";
import {
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Zap,
  Users,
  FileText,
  BarChart3,
  Eye,
  ChevronRight,
  ChevronDown,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  GripVertical
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";

// Define the Project interface locally since we removed it from mockData
interface Project {
  id: string;
  name: string;
  type: string;
  size: string;
  state: string;
  city: string;
  volume: number;
  status: 'active' | 'completed' | 'planning';
  isPredicted: boolean;
  createdAt: Date;
  timeline: {
    design: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    development: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    procurement: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    installation: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
  };
}

// Define mock procurement items locally since we removed them from mockData
const mockProcurementItems = [
  {
    id: '1',
    material: 'Structural Steel',
    orderBy: new Date('2025-08-25'),
    deliveryStart: new Date('2025-09-10'),
    deliveryEnd: new Date('2025-09-25'),
    status: 'critical',
    vendor: 'Tata Steel Ltd.',
  },
  {
    id: '2',
    material: 'Concrete (M40)',
    orderBy: new Date('2025-09-05'),
    deliveryStart: new Date('2025-09-20'),
    deliveryEnd: new Date('2025-10-05'),
    status: 'on-track',
    vendor: 'Ultratech Concrete Supplies',
  },
  {
    id: '3',
    material: 'Glass Curtain Wall',
    orderBy: new Date('2025-10-01'),
    deliveryStart: new Date('2025-10-20'),
    deliveryEnd: new Date('2025-11-05'),
    status: 'warning',
    vendor: 'Saint-Gobain Glass India',
  },
  {
    id: '4',
    material: 'HVAC Systems',
    orderBy: new Date('2025-11-10'),
    deliveryStart: new Date('2025-12-01'),
    deliveryEnd: new Date('2025-12-15'),
    status: 'on-track',
    vendor: 'Blue Star HVAC',
  },
];



export function ProjectSchedule({ project }) {
  const [viewMode, setViewMode] = useState('table');
  const [showGanttOverlay, setShowGanttOverlay] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['design']));
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const { toast } = useToast();

  // Initialize tasks from project phases
  useEffect(() => {
    const initialTasks = [
      {
        id: 'task-1',
        name: 'Conceptual & Schematic Design',
        phase: 'Design',
        duration,
        startDate: new Date('2025-01-01'),
        finishDate: new Date('2025-01-31'),
        completion,
        notes: 'Architectural planning and initial design concepts',
        dependencies: [],
        status: 'in-progress'
      },
      {
        id: 'task-2',
        name: 'Design Development',
        phase: 'Design',
        duration,
        startDate: new Date('2025-02-01'),
        finishDate: new Date('2025-03-17'),
        completion,
        notes: 'Detailed engineering drawings and specifications',
        dependencies: ['task-1'],
        status: 'in-progress'
      },
      {
        id: 'task-3',
        name: 'Construction Documents (IFC)',
        phase: 'Design',
        duration,
        startDate: new Date('2025-03-18'),
        finishDate: new Date('2025-04-17'),
        completion,
        notes: 'Issued for Construction drawings and final specifications',
        dependencies: ['task-2'],
        status: 'pending'
      },
      {
        id: 'task-4',
        name: 'Electrical Installation',
        phase: 'Installation',
        duration,
        startDate: new Date('2025-12-01'),
        finishDate: new Date('2025-01-30'),
        completion,
        notes: 'Electrical systems installation and testing',
        dependencies: ['task-3'],
        status: 'pending'
      },
      {
        id: 'task-5',
        name: 'Mechanical Installation',
        phase: 'Installation',
        duration,
        startDate: new Date('2025-12-15'),
        finishDate: new Date('2025-01-29'),
        completion,
        notes: 'HVAC and mechanical systems installation',
        dependencies: ['task-3'],
        status: 'pending'
      }
    ];
    setTasks(initialTasks);
  }, []);

  const phases = [
    {
      id: 'design',
      name: 'Design Phase',
      description: 'Architectural planning and engineering design',
      icon,
      progress,
      ...project.timeline.design,
    },
    {
      id: 'development',
      name: 'Development Phase',
      description: 'Permits, approvals, and preparation',
      icon,
      progress,
      ...project.timeline.development,
    },
    {
      id: 'procurement',
      name: 'Procurement Phase',
      description: 'Material sourcing and vendor coordination',
      icon,
      progress,
      ...project.timeline.procurement,
    },
    {
      id: 'installation',
      name: 'Installation Phase',
      description: 'Construction and final installation',
      icon,
      progress,
      ...project.timeline.installation,
    },
  ];

  const togglePhaseExpansion = (phaseId) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  // Task editing functions
  const startEditing = (taskId) => {
    setEditingTask(taskId);
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? {
          ...task,
          tempDuration: task.duration,
          tempStartDate: format(task.startDate, 'yyyy-MM-dd'),
          tempFinishDate: format(task.finishDate, 'yyyy-MM-dd'),
          tempCompletion: task.completion,
          tempNotes: task.notes
        }
        
    ));
  };

  const cancelEditing = (taskId) => {
    setEditingTask(null);
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? {
          ...task,
          tempDuration,
          tempStartDate,
          tempFinishDate,
          tempCompletion,
          tempNotes: undefined
        }
        
    ));
  };

  const saveEditing = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newDuration = task.tempDuration || task.duration;
    const newStartDate = task.tempStartDate ? parseISO(task.tempStartDate) : task.startDate;
    const newFinishDate = task.tempFinishDate ? parseISO(task.tempFinishDate) : task.finishDate;
    const newCompletion = task.tempCompletion !== undefined ? task.tempCompletion : task.completion;
    const newNotes = task.tempNotes || task.notes;

    // Validate dates
    if (!isValid(newStartDate) || !isValid(newFinishDate)) {
      toast({
        title: "Invalid Date",
        description: "Please enter valid dates",
        variant: "destructive"
      });
      return;
    }

    if (newFinishDate <= newStartDate) {
      toast({
        title: "Invalid Date Range",
        description: "Finish date must be after start date",
        variant: "destructive"
      });
      return;
    }

    // Update the task
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const shouldBeCompleted = newCompletion === 100;
      return {
        ...t,
        duration,
        startDate,
        finishDate,
        completion,
        // If completion is 100, ensure status is marked as completed
        status: shouldBeCompleted ? 'completed' : t.status,
        notes,
        tempDuration,
        tempStartDate,
        tempFinishDate,
        tempCompletion,
        tempNotes: undefined
      };
    }));

    setEditingTask(null);
    toast({
      title: "Task Updated",
      description: `Schedule updated for ${task.name}`,
    });
  };

  const updateTempValue = (taskId, field, value) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, [field]: value }
        
    ));
  };

  const addNewTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      name: 'New Task',
      phase: 'Design',
      duration,
      startDate: new Date(),
      finishDate: addDays(new Date(), 30),
      completion,
      notes: '',
      dependencies: [],
      status: 'pending',
      isEditing,
      tempDuration,
      tempStartDate: format(new Date(), 'yyyy-MM-dd'),
      tempFinishDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      tempCompletion,
      tempNotes: ''
    };
    setTasks(prev => [...prev, newTask]);
    setEditingTask(newTask.id);
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "Task Deleted",
      description: "Task has been removed from the schedule",
    });
  };

  // Enhanced procurement data for Gantt overlay
  const procurementGanttData = useMemo(() => {
    return mockProcurementItems.map((item, index) => ({
      name: item.material,
      vendor: item.vendor,
      status: item.status,
      orderBy: item.orderBy,
      deliveryStart: item.deliveryStart,
      deliveryEnd: item.deliveryEnd,
      y: index * 30 + 20,
      height,
      type: 'procurement'
    }));
  }, []);

  // Installation timeline data
  const installationGanttData = useMemo(() => {
    return [
      {
        name: 'Foundation Work',
        start: new Date('2025-12-01'),
        end: new Date('2025-12-15'),
        y,
        height,
        type: 'installation'
      },
      {
        name: 'Structural Assembly',
        start: new Date('2025-12-16'),
        end: new Date('2025-12-31'),
        y,
        height,
        type: 'installation'
      }
    ];
  }, []);

  const getPhaseProgress = (phase) => {
    const today = new Date();
    const totalDays = differenceInDays(phase.end, phase.start);

    if (phase.status === 'completed') return 100;
    if (phase.status === 'pending') return 0;

    if (isBefore(today, phase.start)) return 0;
    if (isAfter(today, phase.end)) return 100;

    const daysElapsed = differenceInDays(today, phase.start);
    return Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-success';
      case 'in-progress':
        return 'status-warning';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const overallProgress = phases.reduce((sum, phase) => sum + getPhaseProgress(phase), 0) / phases.length;

  return (
    <div className="tab-content">

      {/* Enhanced Header with Controls */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Project Schedule</CardTitle>
              <CardDescription>
                Editable project timeline with interactive Gantt charts
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={addNewTask}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Table
                </Button>

              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(tasks.reduce((sum, task) => sum + task.completion, 0) / tasks.length)}%
                </span>
              </div>
              <Progress value={tasks.reduce((sum, task) => sum + task.completion, 0) / tasks.length} className="h-3" />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {tasks.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {tasks.length > 0 ? format(Math.max(...tasks.map(t => t.finishDate.getTime())), 'MMM yyyy') : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Target Completion</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Management Summary */}
      <Card className="dashboard-card mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Project Schedule Summary
          </CardTitle>
          <CardDescription>Overview of project phases and task distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Phase Distribution</h4>
              <div className="space-y-3">
                {['Design', 'Development', 'Procurement', 'Installation'].map(phase => {
                  const phaseTasks = tasks.filter(t => t.phase === phase);
                  const completedTasks = phaseTasks.filter(t => t.status === 'completed').length;
                  const totalTasks = phaseTasks.length;

                  return (
                    <div key={phase} className="flex items-center justify-between">
                      <span className="text-sm">{phase}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} className="w-20 h-2" />
                        <span className="text-sm text-muted-foreground w-12">
                          {completedTasks}/{totalTasks}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Task Status Overview</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {tasks.filter(t => t.status === 'completed').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Progress</span>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    {tasks.filter(t => t.status === 'pending').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Blocked</span>
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {tasks.filter(t => t.status === 'blocked').length}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Table View */}
      {viewMode === 'table' && (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Project Tasks</CardTitle>
            <CardDescription>Manage project phases, tasks, and timelines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Task Name</th>
                    <th className="text-left p-3 font-medium">Phase</th>
                    <th className="text-left p-3 font-medium">Duration</th>
                    <th className="text-left p-3 font-medium">Start Date</th>
                    <th className="text-left p-3 font-medium">Finish Date</th>
                    <th className="text-left p-3 font-medium">Completion</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Notes</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => {
                    const isEditing = editingTask === task.id;

                    return (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity, y: 10 }}
                        animate={{ opacity, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={task.name}
                              onChange={(e) => updateTempValue(task.id, 'name', e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            <div className="font-medium">{task.name}</div>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Select value={task.phase} onValueChange={(value) => updateTempValue(task.id, 'phase', value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Development">Development</SelectItem>
                                <SelectItem value="Procurement">Procurement</SelectItem>
                                <SelectItem value="Installation">Installation</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{task.phase}</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={task.tempDuration || task.duration}
                              onChange={(e) => updateTempValue(task.id, 'tempDuration', parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          ) : (
                            <span>{task.duration} days</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={task.tempStartDate || format(task.startDate, 'yyyy-MM-dd')}
                              onChange={(e) => updateTempValue(task.id, 'tempStartDate', e.target.value)}
                              className="w-36"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {format(task.startDate, 'MMM dd, yyyy')}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={task.tempFinishDate || format(task.finishDate, 'yyyy-MM-dd')}
                              onChange={(e) => updateTempValue(task.id, 'tempFinishDate', e.target.value)}
                              className="w-36"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {format(task.finishDate, 'MMM dd, yyyy')}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={task.tempCompletion !== undefined ? task.tempCompletion : task.completion}
                                onChange={(e) => updateTempValue(task.id, 'tempCompletion', parseInt(e.target.value) || 0)}
                                className="w-16"
                              />
                              <span className="text-xs">%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Progress value={task.completion} className="w-16 h-2" />
                              <span className="text-sm">{task.completion}%</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusIcon(task.status)}
                            <span className="ml-1 capitalize">{task.status.replace('-', ' ')}</span>
                          </Badge>
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Textarea
                              value={task.tempNotes || task.notes}
                              onChange={(e) => updateTempValue(task.id, 'tempNotes', e.target.value)}
                              className="w-48 h-16 text-xs"
                              placeholder="Add notes..."
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {task.notes}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 items-center">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => saveEditing(task.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelEditing(task.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(task.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteTask(task.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
