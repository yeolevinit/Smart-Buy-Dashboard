import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, FolderOpen, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./ProjectCard";
import { NewProjectModal } from "./NewProjectModal";

// Define the Project interface locally since we removed it from mockData



export function Sidebar({ projects, selectedProject, onSelectProject, onCreateProject }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsCollapsed(true)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? "auto" : "320px",
          x: isCollapsed ? "-100%" : "0%",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border lg:relative lg:translate-x-0 lg:z-auto"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <motion.div
                initial={{ opacity, x: -20 }}
                animate={{ opacity, x: 0 }}
                className="text-lg font-semibold"
              >
                ProcureAI India
              </motion.div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsCollapsed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* New Project Button */}
          <div className="p-6 border-b border-sidebar-border">
            <NewProjectModal onCreateProject={onCreateProject} />
          </div>

          {/* Projects List */}
          <div className="flex-1 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Projects</h3>
              </div>
            </div>

            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(100vh-280px)]">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity, y: 20 }}
                      animate={{ opacity, y: 0 }}
                      exit={{ opacity, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProjectCard
                        project={project}
                        isSelected={selectedProject?.id === project.id}
                        onClick={() => onSelectProject(project)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {projects.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <FolderOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No projects yet</p>
                    <p className="text-xs">Create your first project to get started</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-6 border-t border-sidebar-border">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-40 lg:hidden"
        onClick={() => setIsCollapsed(false)}
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  );
}
