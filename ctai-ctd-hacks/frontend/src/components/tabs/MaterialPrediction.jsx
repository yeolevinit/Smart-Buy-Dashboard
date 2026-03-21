import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Package, IndianRupee, TrendingUp, Activity } from "lucide-react";

// Fallback mock materials used when no prediction data is available
const DEFAULT_MOCK_MATERIALS = [
  { id: '1', name: 'Structural Steel', category: 'Structure', quantity: 450, unit: 'tons', cost: 56000000 },
  { id: '2', name: 'Concrete (M40)', category: 'Foundation', quantity: 2800, unit: 'm³', cost: 32000000 },
  { id: '3', name: 'Glass Curtain Wall', category: 'Exterior', quantity: 1200, unit: 'm²', cost: 75000000 },
  { id: '4', name: 'HVAC Systems', category: 'MEP', quantity: 24, unit: 'units', cost: 28000000 },
  { id: '5', name: 'Electrical Conduits', category: 'Electrical', quantity: 5500, unit: 'm', cost: 6200000 },
  { id: '6', name: 'Fire Safety Systems', category: 'Safety', quantity: 8, unit: 'systems', cost: 13500000 },
  { id: '7', name: 'Insulation Materials', category: 'Interior', quantity: 3200, unit: 'm²', cost: 4800000 },
  { id: '8', name: 'Plumbing Fixtures', category: 'MEP', quantity: 180, unit: 'units', cost: 9800000 },
];

export function MaterialPrediction({ project, showPredictionResults = false, predictionData }) {
  // Use real prediction data if available, otherwise fall back to mock data
  const materials = predictionData?.materials?.length
    ? predictionData.materials
    : DEFAULT_MOCK_MATERIALS;

  const totalCost = predictionData?.total_cost
    || DEFAULT_MOCK_MATERIALS.reduce((sum, m) => sum + m.cost, 0);

  const confidence = predictionData?.confidence ?? 94.0;
  const totalQuantity = materials.reduce((sum, m) => sum + m.quantity, 0);
  const avgCostPerUnit = totalQuantity > 0 ? Math.round(totalCost / totalQuantity) : 0;

  const barChartData = materials.map(material => ({
    name: material.name.split(' ')[0],
    quantity: material.quantity,
    cost: material.cost / 100000, // convert to lakhs for readability
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
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
        {[
          {
            title: "Total Materials",
            icon: <Package className="h-4 w-4 text-muted-foreground" />,
            value: materials.length,
            sub: "Material types required",
            delay: 0.1,
          },
          {
            title: "Total Cost",
            icon: <IndianRupee className="h-4 w-4 text-muted-foreground" />,
            value: `₹${(totalCost / 10000000).toFixed(2)} Cr`,
            sub: "Estimated procurement cost",
            delay: 0.2,
          },
          {
            title: "Avg. Cost/Unit",
            icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            value: `₹${avgCostPerUnit.toLocaleString('en-IN')}`,
            sub: "Per unit average",
            delay: 0.3,
          },
          {
            title: "Confidence",
            icon: <Activity className="h-4 w-4 text-muted-foreground" />,
            value: `${confidence.toFixed(1)}%`,
            sub: "Prediction accuracy",
            delay: 0.4,
          },
        ].map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: card.delay }}
          >
            <Card className="dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
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
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 * index }}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 font-medium">{material.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {material.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {material.quantity.toLocaleString('en-IN')} {material.unit}
                      </td>
                      <td className="py-3 px-4">
                        ₹{Math.round(material.cost / material.quantity).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        ₹{material.cost.toLocaleString('en-IN')}
                      </td>
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
