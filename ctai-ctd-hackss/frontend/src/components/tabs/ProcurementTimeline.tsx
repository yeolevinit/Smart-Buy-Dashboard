import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Project, mockProcurementItems } from "@/data/mockData";
import { format, differenceInDays, startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import { Calendar, Clock, AlertTriangle, CheckCircle, Package, Search, Filter, BarChart3, Table, Eye, Edit3, Save, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface ProcurementTimelineProps {
  project: Project;
}

interface EditableItem {
  id: string;
  material: string;
  vendor: string;
  category: string;
  orderBy: Date;
  deliveryStart: Date;
  deliveryEnd: Date;
  status: 'critical' | 'warning' | 'on-track';
  leadTime: number;
  notes: string;
  isEditing?: boolean;
  tempOrderBy?: string;
  tempDeliveryStart?: string;
  tempDeliveryEnd?: string;
}

export function ProcurementTimeline({ project }: ProcurementTimelineProps) {
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'status-danger';
      case 'warning':
        return 'status-warning';
      case 'on-track':
        return 'status-success';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'on-track':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const calculateTimeToOrder = (orderBy: Date) => {
    const today = new Date();
    const daysUntilOrder = differenceInDays(orderBy, today);
    return daysUntilOrder;
  };

  // Initialize editable items from mock data
  useEffect(() => {
    const initialItems: EditableItem[] = mockProcurementItems.map(item => ({
      id: item.id,
      material: item.material,
      vendor: item.vendor,
      category: item.material.includes('Steel') || item.material.includes('Concrete') ? 'Structural' :
                item.material.includes('HVAC') || item.material.includes('Electrical') ? 'MEP' :
                item.material.includes('Glass') || item.material.includes('Fire') ? 'Exterior' : 'Other',
      orderBy: item.orderBy,
      deliveryStart: item.deliveryStart,
      deliveryEnd: item.deliveryEnd,
      status: item.status,
      leadTime: differenceInDays(item.deliveryStart, item.orderBy),
      notes: item.status === 'critical' ? 'Critical path item - monitor closely' :
             item.status === 'warning' ? 'Potential delay risk' : 'On track'
    }));
    setEditableItems(initialItems);
  }, []);

  // Enhanced items for filtering and display
  const enhancedItems = useMemo(() => {
    return editableItems;
  }, [editableItems]);

  const filteredItems = useMemo(() => {
    return enhancedItems.filter(item => {
      const matchesSearch = item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [enhancedItems, searchTerm, categoryFilter, statusFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => a.orderBy.getTime() - b.orderBy.getTime());
  }, [filteredItems]);

  // Gantt chart data
  const ganttData = useMemo(() => {
    const today = new Date();
    const minDate = new Date(Math.min(...sortedItems.map(item => item.orderBy.getTime())));
    const maxDate = new Date(Math.max(...sortedItems.map(item => item.deliveryEnd.getTime())));
    
    return sortedItems.map((item, index) => {
      const startOffset = differenceInDays(item.orderBy, minDate);
      const duration = differenceInDays(item.deliveryEnd, item.orderBy);
      const deliveryDuration = differenceInDays(item.deliveryEnd, item.deliveryStart);
      
      return {
        name: item.material,
        vendor: item.vendor,
        category: item.category,
        status: item.status,
        startOffset,
        duration,
        deliveryDuration,
        orderBy: item.orderBy,
        deliveryStart: item.deliveryStart,
        deliveryEnd: item.deliveryEnd,
        leadTime: item.leadTime,
        notes: item.notes,
        y: index * 40 + 20, // Y position for rendering
        height: 30
      };
    });
  }, [sortedItems]);

  const categories = useMemo(() => {
    return Array.from(new Set(enhancedItems.map(item => item.category)));
  }, [enhancedItems]);

  // Editing functions
  const startEditing = (itemId: string) => {
    setEditingItem(itemId);
    setEditableItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            tempOrderBy: format(item.orderBy, 'yyyy-MM-dd'),
            tempDeliveryStart: format(item.deliveryStart, 'yyyy-MM-dd'),
            tempDeliveryEnd: format(item.deliveryEnd, 'yyyy-MM-dd')
          }
        : item
    ));
  };

  const cancelEditing = (itemId: string) => {
    setEditingItem(null);
    setEditableItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            tempOrderBy: undefined,
            tempDeliveryStart: undefined,
            tempDeliveryEnd: undefined
          }
        : item
    ));
  };

  const saveEditing = (itemId: string) => {
    const item = editableItems.find(i => i.id === itemId);
    if (!item) return;

    const newOrderBy = item.tempOrderBy ? parseISO(item.tempOrderBy) : item.orderBy;
    const newDeliveryStart = item.tempDeliveryStart ? parseISO(item.tempDeliveryStart) : item.deliveryStart;
    const newDeliveryEnd = item.tempDeliveryEnd ? parseISO(item.tempDeliveryEnd) : item.deliveryEnd;

    // Validate dates
    if (!isValid(newOrderBy) || !isValid(newDeliveryStart) || !isValid(newDeliveryEnd)) {
      toast({
        title: "Invalid Date",
        description: "Please enter valid dates",
        variant: "destructive"
      });
      return;
    }

    if (newDeliveryStart <= newOrderBy) {
      toast({
        title: "Invalid Delivery Date",
        description: "Delivery start must be after order date",
        variant: "destructive"
      });
      return;
    }

    if (newDeliveryEnd <= newDeliveryStart) {
      toast({
        title: "Invalid Delivery Window",
        description: "Delivery end must be after delivery start",
        variant: "destructive"
      });
      return;
    }

    // Update the item
    setEditableItems(prev => prev.map(i => 
      i.id === itemId 
        ? {
            ...i,
            orderBy: newOrderBy,
            deliveryStart: newDeliveryStart,
            deliveryEnd: newDeliveryEnd,
            leadTime: differenceInDays(newDeliveryStart, newOrderBy),
            tempOrderBy: undefined,
            tempDeliveryStart: undefined,
            tempDeliveryEnd: undefined
          }
        : i
    ));

    setEditingItem(null);
    toast({
      title: "Updated",
      description: `Schedule updated for ${item.material}`,
    });
  };

  const updateTempValue = (itemId: string, field: 'tempOrderBy' | 'tempDeliveryStart' | 'tempDeliveryEnd', value: string) => {
    setEditableItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  // Vendor integration - check for finalized vendors and update delivery dates
  const syncWithVendorData = () => {
    // This would typically come from a context or props from VendorsTab
    // For now, we'll simulate vendor data integration
    const finalizedVendors = JSON.parse(localStorage.getItem('finalizedVendors') || '{}');
    
    if (Object.keys(finalizedVendors).length > 0) {
      setEditableItems(prev => prev.map(item => {
        const vendorData = finalizedVendors[item.material];
        if (vendorData && vendorData.deliveryDate) {
          const deliveryDate = new Date(vendorData.deliveryDate);
          const deliveryStart = new Date(deliveryDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before
          const deliveryEnd = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days after
          
          return {
            ...item,
            deliveryStart,
            deliveryEnd,
            leadTime: differenceInDays(deliveryStart, item.orderBy),
            notes: vendorData.notes || item.notes
          };
        }
        return item;
      }));
      
      toast({
        title: "Vendor Data Synced",
        description: "Delivery dates updated from finalized vendors",
      });
    }
  };

  // Auto-sync with vendor data on component mount
  useEffect(() => {
    syncWithVendorData();
  }, []);


  return (
    <div className="tab-content">
      {/* Enhanced Header with Controls */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Procurement Timeline</CardTitle>
              <CardDescription>
                Interactive timeline with Gantt charts and filters
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'gantt' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('gantt')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gantt
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search materials or vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="on-track">On Track</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Overview Stats */}
      <Card className="dashboard-card mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {sortedItems.filter(item => item.status === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">Critical Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {sortedItems.filter(item => item.status === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {sortedItems.filter(item => item.status === 'on-track').length}
              </div>
              <div className="text-sm text-muted-foreground">On Track</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sortedItems.length > 0 ? Math.min(...sortedItems.map(item => calculateTimeToOrder(item.orderBy))) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Days to Next Order</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Table or Gantt View */}
      {viewMode === 'table' ? (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Detailed Schedule</CardTitle>
            <CardDescription>Complete procurement timeline with key dates and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Order By</th>
                    <th>Delivery Window</th>
                    <th>Lead Time</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item, index) => {
                    const leadTime = differenceInDays(item.deliveryStart, item.orderBy);
                    const orderDays = calculateTimeToOrder(item.orderBy);
                    const isEditing = editingItem === item.id;
                    
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="font-medium">{item.material}</td>
                        <td>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </td>
                        <td>{item.vendor}</td>
                        <td>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={item.tempOrderBy || ''}
                              onChange={(e) => updateTempValue(item.id, 'tempOrderBy', e.target.value)}
                              className="w-32 text-xs"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {format(item.orderBy, 'MMM dd, yyyy')}
                            </div>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="date"
                                value={item.tempDeliveryStart || ''}
                                onChange={(e) => updateTempValue(item.id, 'tempDeliveryStart', e.target.value)}
                                className="w-28 text-xs"
                              />
                              <span className="text-xs">-</span>
                              <Input
                                type="date"
                                value={item.tempDeliveryEnd || ''}
                                onChange={(e) => updateTempValue(item.id, 'tempDeliveryEnd', e.target.value)}
                                className="w-28 text-xs"
                              />
                            </div>
                          ) : (
                            <span>
                              {format(item.deliveryStart, 'MMM dd')} - {format(item.deliveryEnd, 'MMM dd')}
                            </span>
                          )}
                        </td>
                        <td>{leadTime} days</td>
                        <td>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{item.status.replace('-', ' ')}</span>
                          </Badge>
                        </td>
                        <td className="text-sm text-muted-foreground max-w-xs truncate">
                          {item.notes}
                        </td>
                        <td>
                          <div className="flex gap-1 items-center">
                            {orderDays <= 7 && (
                              <Badge variant="outline" className="text-xs">
                                {orderDays <= 0 ? 'Urgent' : 'Soon'}
                              </Badge>
                            )}
                            {isEditing ? (
                              <div className="flex gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => saveEditing(item.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelEditing(item.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(item.id)}
                                className="h-6 w-6 p-0 ml-2"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
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
      ) : (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Interactive Gantt Chart</CardTitle>
            <CardDescription>Visual timeline with hover tooltips and color-coded status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Critical Path</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Potential Delays</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>On Track</span>
                </div>
              </div>

              {/* Gantt Chart */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px] space-y-2">
                  {ganttData.map((item, index) => {
                    const getBarColor = (status: string) => {
                      switch (status) {
                        case 'critical': return '#ef4444';
                        case 'warning': return '#f59e0b';
                        case 'on-track': return '#10b981';
                        default: return '#6b7280';
                      }
                    };

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="relative h-12 flex items-center group"
                      >
                        {/* Material Label */}
                        <div className="w-48 pr-4 flex-shrink-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.vendor}</div>
                        </div>

                        {/* Timeline Bar */}
                        <div className="flex-1 relative h-8 bg-muted rounded-lg overflow-hidden">
                          {/* Order to delivery start (gray) */}
                          <div 
                            className="absolute top-0 left-0 h-full bg-gray-300 dark:bg-gray-600"
                            style={{ 
                              width: `${Math.max(10, (item.startOffset / Math.max(...ganttData.map(d => d.startOffset + d.duration)) * 80))}%`
                            }}
                          />
                          
                          {/* Delivery window (colored) */}
                          <div 
                            className="absolute top-0 h-full rounded-r-lg"
                            style={{ 
                              left: `${Math.max(10, (item.startOffset / Math.max(...ganttData.map(d => d.startOffset + d.duration)) * 80))}%`,
                              width: `${Math.max(5, (item.deliveryDuration / Math.max(...ganttData.map(d => d.startOffset + d.duration)) * 20))}%`,
                              backgroundColor: getBarColor(item.status)
                            }}
                          />

                          {/* Tooltip on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-popover border rounded-lg p-3 shadow-lg z-10 min-w-[250px]">
                              <div className="text-sm">
                                <div className="font-medium mb-2">{item.name}</div>
                                <div className="space-y-1 text-muted-foreground">
                                  <div>Vendor: {item.vendor}</div>
                                  <div>Category: {item.category}</div>
                                  <div>Order By: {format(item.orderBy, 'MMM dd, yyyy')}</div>
                                  <div>Delivery: {format(item.deliveryStart, 'MMM dd')} - {format(item.deliveryEnd, 'MMM dd')}</div>
                                  <div>Lead Time: {item.leadTime} days</div>
                                  <div>Status: {item.status}</div>
                                  <div className="pt-1 border-t">Notes: {item.notes}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="w-20 pl-4 flex-shrink-0">
                          <Badge className={getStatusColor(item.status)} variant="outline">
                            {item.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts and Warnings */}
      {sortedItems.some(item => item.status === 'critical') && (
        <Card className="dashboard-card border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical Path Alerts
            </CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedItems.filter(item => item.status === 'critical').map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{item.material}</div>
                    <div className="text-sm text-muted-foreground">
                      Order by {format(item.orderBy, 'MMM dd, yyyy')} • {item.notes}
                    </div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}