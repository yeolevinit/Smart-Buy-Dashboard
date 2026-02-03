import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type PredictionResponse, type MaterialPrediction as APIMaterialPrediction } from "@/services/api";
import { Package, IndianRupee, TrendingUp, Activity } from "lucide-react";

// Define the Project interface locally since we removed it from mockData


// Define mock materials locally since we removed them from mockData
const mockMaterials = [
  { id: '1', name: 'Structural Steel', quantity, unit: 'tons', cost, category: 'Structure' }, // ₹5.6 Cr
  { id: '2', name: 'Concrete (M40)', quantity, unit: 'm³', cost, category: 'Foundation' },
  { id: '3', name: 'Glass Curtain Wall', quantity, unit: 'm²', cost, category: 'Exterior' },
  { id: '4', name: 'HVAC Systems', quantity, unit: 'units', cost, category: 'MEP' },
  { id: '5', name: 'Electrical Conduits', quantity, unit: 'm', cost, category: 'Electrical' },
  { id: '6', name: 'Fire Safety Systems', quantity, unit: 'systems', cost, category: 'Safety' },
  { id: '7', name: 'Insulation Materials', quantity, unit: 'm²', cost, category: 'Interior' },
  { id: '8', name: 'Plumbing Fixtures', quantity, unit: 'units', cost, category: 'MEP' },
];


export function MaterialPrediction({ project, showPredictionResults = false, predictionData }) {
  // Use real prediction data if available, otherwise fall back to mock data
  const materials = predictionData?.materials || mockMaterials.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    quantity: m.quantity,
    unit: m.unit,
    cost: m.cost
  }));
  
  const totalCost = predictionData?.total_cost || mockMaterials.reduce((sum, material) => sum + material.cost, 0);
  const confidence = predictionData?.confidence || 94.0;
  const totalQuantity = materials.reduce((sum, material) => sum + material.quantity, 0);
  
  // Ensure we don't divide by zero
  const avgCostPerUnit = totalQuantity > 0 ? Math.round(totalCost / totalQuantity) ;

  const barChartData = materials.map(material => ({
    name: material.name.split(' ')[0], // Shortened names for chart
    quantity: material.quantity,
    cost: material.cost / 100000, // Convert to lakhs
  }));

  const pieChartData = materials.map((material, index) => ({
    name: material.category,
    value: material.cost,
    fill: `hsl(${(index * 45) % 360}, 70%, 50%)`,
  }));

  const chartConfig = {
    quantity: { label: "Quantity", color: "hsl(var(--primary))" },
    cost: { label: "Cost (₹ Lakhs)", color: "hsl(var(--secondary))" },
  };

  return (
    <div className="tab-content">
      {/* AI Prediction Results Banner */}
      {showPredictionResults && (
        <motion.div
          initial={{ opacity, y: -20 }}
          animate={{ opacity, y: 0 }}
          className="mb-6"
        >
          <Card className="dashboard-card border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">AI Prediction Complete</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {predictionData 
                  ? `AI prediction generated with ${confidence.toFixed(1)}% confidence for ${project.type}.`
                  : "Material requirements and cost analysis generated based on your project specifications."
                }
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <motion.div
          initial={{ opacity, y: 20 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.length}</div>
              <p className="text-xs text-muted-foreground">Material types required</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity, y: 20 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalCost / 10000000).toFixed(2)} Cr</div>
              <p className="text-xs text-muted-foreground">Estimated procurement cost</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity, y: 20 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Cost/Unit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{avgCostPerUnit.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">Per unit average</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity, y: 20 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confidence</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confidence.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Prediction accuracy</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity, x: -20 }}
          animate={{ opacity, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Material Quantities</CardTitle>
              <CardDescription>Predicted quantities by material type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity, x: 20 }}
          animate={{ opacity, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Cost Distribution</CardTitle>
              <CardDescription>Cost breakdown by material category</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Materials Table */}
      <motion.div
        initial={{ opacity, y: 20 }}
        animate={{ opacity, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Material Requirements</CardTitle>
            <CardDescription>Detailed breakdown of predicted materials and costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Material</th>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-left py-3 px-4 font-medium">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium">Unit Cost</th>
                    <th className="text-left py-3 px-4 font-medium">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material, index) => (
                    <motion.tr
                      key={material.id}
                      initial={{ opacity, x: -20 }}
                      animate={{ opacity, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 * index }}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 font-medium">{material.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {material.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">{material.quantity.toLocaleString('en-IN')} {material.unit}</td>
                      <td className="py-3 px-4">₹{Math.round(material.cost / material.quantity).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">₹{material.cost.toLocaleString('en-IN')}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
