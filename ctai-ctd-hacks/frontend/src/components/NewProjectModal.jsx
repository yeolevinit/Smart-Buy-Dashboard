import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the Project interface locally since we removed it from mockData



export function NewProjectModal({ onCreateProject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    size: '',
    state: '',
    city: '',
    volume: '',
    status: 'planning',
  });

  const projectTypes = [
    'Commercial Construction',
    'Industrial Infrastructure',
    'Residential Development',
    'Healthcare Facility',
    'Educational Institution',
    'Transportation Hub',
    'Mixed-Use Development',
  ];

  const projectSizes = [
    'Small (<₹1Cr)',
    'Medium (₹1Cr–₹10Cr)',
    'Large (>₹10Cr)',
  ];

  const indianStates = [
    'Maharashtra',
    'Karnataka',
    'Tamil Nadu',
    'Gujarat',
    'Delhi',
    'Uttar Pradesh',
    'Telangana',
    'West Bengal',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    if (!formData.name || !formData.type || !formData.size || !formData.state || !formData.city || !formData.volume) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateProject({
        name: formData.name,
        type: formData.type,
        size: formData.size,
        state: formData.state,
        city: formData.city,
        volume: parseInt(formData.volume),
        status: formData.status,
      });

      // Reset form
      setFormData({
        name: '',
        type: '',
        size: '',
        state: '',
        city: '',
        volume: '',
        status: 'planning',
      });
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenChange = (open) => {
    // Reset form when dialog is closed
    if (!open) {
      setFormData({
        name: '',
        type: '',
        size: '',
        state: '',
        city: '',
        volume: '',
        status: 'planning',
      });
      setIsSubmitting(false);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="w-full gradient-button gap-2 h-11 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Project</DialogTitle>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Project Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Estimated Volume (₹)</Label>
              <Input
                id="volume"
                type="number"
                placeholder="Enter estimated project volume"
                value={formData.volume}
                onChange={(e) => handleInputChange('volume', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gradient-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
