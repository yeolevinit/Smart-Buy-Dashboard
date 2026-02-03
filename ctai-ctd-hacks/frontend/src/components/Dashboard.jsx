import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { ProjectTabs } from "./ProjectTabs";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { logout } from "@/pages/Login";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, TrendingUp, Clock, AlertCircle, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";

// Define the Project interface locally since we removed it from mockData
// Project definition removed (it was a TypeScript interface)

export function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch projects from database on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsInitialLoading(true);
      console.log("Fetching projects from API...");
      const fetchedProjects = await apiService.getAllProjects();
      console.log(`Fetched ${fetchedProjects.length} projects from API`);

      // Convert API response to Project format
      const convertedProjects = fetchedProjects.map((project) => ({
        id: project.id,
        name: project.name,
        type: project.project_type,
        size: project.size,
        state: project.state,
        city: project.city,
        volume: project.volume,
        status: project.status === 'active' || project.status === 'completed' || project.status === 'planning' ? project.status : 'planning',
        isPredicted: project.is_predicted || false,
        createdAt: new Date(project.created_at || Date.now()),
        timeline: {
          design: {
            start: new Date(),
            end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: 'pending'
          },
          development: {
            start: new Date(Date.now() + 61 * 24 * 60 * 60 * 1000),
            end: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
            status: 'pending'
          },
          procurement: {
            start: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            status: 'pending'
          },
          installation: {
            start: new Date(Date.now() + 181 * 24 * 60 * 60 * 1000),
            end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: 'pending'
          },
        },
      }));

      setProjects(convertedProjects);

      // Select the first project if none is selected
      if (convertedProjects.length > 0 && !selectedProject) {
        setSelectedProject(convertedProjects[0]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      // Set empty array if API fails
      setProjects([]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleCreateProject = async (newProjectData) => {
    setIsLoading(true);
    console.log("Creating new project:", newProjectData);

    try {
      // Convert project data to API format
      const projectRequest = {
        projectType: newProjectData.type,
        size: newProjectData.size,
        state: newProjectData.state,
        city: newProjectData.city,
        volume: newProjectData.volume.toString()
      };

      // Create project in database
      const response = await apiService.createProject(projectRequest);
      console.log("Project creation response:", response);

      if (response.success) {
        // Fetch updated projects list
        console.log("Fetching updated projects list...");
        await fetchProjects();
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = async (project) => {
    setIsLoading(true);

    // Simulate project loading delay
    await new Promise(resolve => setTimeout(resolve, 800));

    setSelectedProject(project);
    setIsLoading(false);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-[320px_1fr]">
      {/* Fixed Sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen overflow-hidden">
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
        />
      </div>

      {/* Main Content - only this scrolls */}
      <div className="min-h-screen flex flex-col lg:overflow-y-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <h1 className="text-xl font-semibold">ProcureAI Dashboard</h1>
            </div>
            <div className="hidden lg:block">
              {/* <h1 className="text-2xl font-bold">AI Procurement Management Platform</h1>
              <p className="text-muted-foreground text-sm">
                Optimize your procurement with intelligent insights and automation
              </p> */}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading project...</p>
              </motion.div>
            </div>
          ) : selectedProject ? (
            <ProjectTabs project={selectedProject} />
          ) : (
            <EmptyState onCreateProject={handleCreateProject} />
          )}
        </main>
      </div>
    </div>
  );
}


function EmptyState({ onCreateProject }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto"
      >
        <div className="mb-8">
          <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
            <FolderOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome to ProcureAI</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Transform your procurement process with AI-powered insights, predictive analytics,
            and intelligent supplier management. Get started by creating your first project.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dashboard-card">
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">AI Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get accurate material quantity and cost predictions based on project parameters
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Smart Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Optimize procurement schedules with intelligent timeline management and risk assessment
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="text-center">
              <AlertCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Identify potential supply chain risks and get proactive mitigation recommendations
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm text-muted-foreground"
        >
          <p>Ready to optimize your procurement process? Create your first project to get started.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
