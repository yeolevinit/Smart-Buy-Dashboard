import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PredictionResponse } from "@/services/api";
import { apiService } from "@/services/api";
import { InputForm } from "./tabs/InputForm";
import { MaterialPrediction } from "./tabs/MaterialPrediction";
import { VendorsTab } from "./tabs/VendorsTab";
import { ProcurementTimeline } from "./tabs/ProcurementTimeline";
import { ProjectSchedule } from "./tabs/ProjectSchedule";
import { ChatbotPanel } from "./tabs/ChatbotPanel";

// Define the Project interface locally since we removed it from mockData



export function ProjectTabs({ project }) {
  const [predictionCompleted, setPredictionCompleted] = useState(project.isPredicted);
  const [predictionData, setPredictionData] = useState(null);
  const [activeTab, setActiveTab] = useState(project.isPredicted ? "prediction" : "input");
  const [projectId, setProjectId] = useState(project.id);

  // Load saved predictions from MongoDB when component mounts
  useEffect(() => {
    const loadSavedPredictions = async () => {
      try {
        // Load predictions for this project
        const savedPredictions = await apiService.getPredictions(project.id);
        if (savedPredictions && savedPredictions.success) {
          setPredictionData(savedPredictions);
          setPredictionCompleted(true);
          setActiveTab("prediction");
        }
      } catch (error) {
        console.error("Error loading saved predictions:", error);
      }
    };

    // Only load predictions if the project has been predicted
    if (project.isPredicted) {
      loadSavedPredictions();
    }
  }, [project.id, project.isPredicted]);

  const handlePredictionComplete = (data) => {
    setPredictionData(data);
    setPredictionCompleted(true);
    setActiveTab("prediction");
  };

  const handleProjectCreated = (projectId) => {
    setProjectId(projectId);
  };

  const handlePredictionCompleteWithSave = async (data) => {
    // Save prediction to MongoDB
    try {
      await apiService.savePrediction(project.id, data);
    } catch (error) {
      console.error("Error saving prediction:", error);
    }
    
    handlePredictionComplete(data);
  };

  // Define tabs based on prediction status
  const tabs = [
    { id: "input", label: "Input Form", visible: !predictionCompleted },
    { id: "prediction", label: "Material Prediction", visible: predictionCompleted },
    { id: "vendors", label: "Vendors", visible: predictionCompleted },
    { id: "timeline", label: "Procurement Timeline", visible: predictionCompleted },
    { id: "schedule", label: "Project Schedule", visible: predictionCompleted },
    { id: "chatbot", label: "AI Assistant", visible: predictionCompleted },
  ];

  // Filter visible tabs
  const visibleTabs = tabs.filter(tab => tab.visible);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground text-sm">
              {project.type} • {project.city}, {project.state} • ₹{(project.volume / 10000000).toFixed(1)} Cr
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium status-badge ${project.status === 'active' ? 'status-success' :
            project.status === 'planning' ? 'status-warning' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
            {project.status}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Only render tab list if there are visible tabs */}
        {visibleTabs.length > 0 && (
          <TabsList className="mx-6 mt-4 grid w-fit grid-cols-6 gap-1 bg-transparent">
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-xs px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <div className="flex-1 overflow-hidden">
          {!predictionCompleted && (
            <TabsContent value="input" className="mt-0 h-full overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <InputForm
                  project={project}
                  onPredictionComplete={handlePredictionCompleteWithSave}
                />
              </motion.div>
            </TabsContent>
          )}

          {predictionCompleted && (
            <>
              <TabsContent value="prediction" className="mt-0 h-full overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <MaterialPrediction
                    project={project}
                    showPredictionResults={predictionCompleted}
                    predictionData={predictionData}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="vendors" className="mt-0 h-full overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <VendorsTab
                    project={project}
                    showPredictionResults={predictionCompleted}
                    predictionData={predictionData}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-0 h-full overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ProcurementTimeline project={project} />
                </motion.div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-0 h-full overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ProjectSchedule project={project} />
                </motion.div>
              </TabsContent>

              <TabsContent value="chatbot" className="mt-0 h-full overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ChatbotPanel project={project} />
                </motion.div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </motion.div>
  );
}
