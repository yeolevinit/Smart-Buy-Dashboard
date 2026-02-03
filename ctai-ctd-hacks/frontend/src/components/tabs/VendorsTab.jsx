import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Mail, Phone, Star, MessageCircle, CheckCircle2, Loader2, RefreshCw, Award, Shield, Clock, ExternalLink, Verified, Eye, Copy, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useVendors } from "@/hooks/useVendors";
import { Vendor, apiService } from "@/services/api";
import { type PredictionResponse } from "@/services/api";

// Define the Project interface locally since we removed it from mockData



export function VendorsTab({ project, showPredictionResults = false, predictionData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [seeVendorsFor, setSeeVendorsFor] = useState(null);
  const [contactVendor, setContactVendor] = useState(null);
  const [finalizedByMaterial, setFinalizedByMaterial] = useState<Record<string, Vendor | null>>({});
  const [managementData, setManagementData] = useState<Record<string, {
    paymentStatus: "Pending" | "Partially Paid" | "Completed";
    deliveryDate: Date | null;
    deliveryStatus: "Not Started" | "In Progress" | "Delivered";
    agreementStatus: "Finalized" | "Pending Confirmation";
    totalAmount;
    paymentMade;
    paymentDueDate: Date | null;
    notes;
    logs: { date; quantity; note?: string }[];
  }>>({});
  const [manageMaterial, setManageMaterial] = useState(null);
  const { toast } = useToast();

  // Use the new vendor hook
  const { vendors, loading, error, searchVendors, finalizeVendor, updateVendor } = useVendors();

  const materials = useMemo(() => {
    // Use predicted materials if available, otherwise show empty array
    if (predictionData?.materials) {
      return predictionData.materials.map(m => ({
        id: m.id,
        name: m.name,
        quantity: m.quantity,
        unit: m.unit,
        cost: m.cost,
        category: m.category,
        vendorAssigned: m.vendorAssigned // Include complete vendor assignment info
      }));
    }
    return [];
  }, [predictionData]);
  
  const materialTypes = useMemo(() => Array.from(new Set(materials.map(m => m.name))), [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m =>
      (selectedMaterial === "all" || m.name.toLowerCase().includes(selectedMaterial.toLowerCase())) &&
      (searchTerm.trim().length === 0 || m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [materials, searchTerm, selectedMaterial]);

  const refreshVendorData = async () => {
    if (!project.id) return;
    
    try {
      // Load finalized vendors from the API
      const projectVendors = await apiService.getProjectVendors(project.id);
      
      // Convert to the format expected by the component
      const finalizedVendors: Record<string, Vendor | null> = {};
      projectVendors.forEach(vendor => {
        if (vendor.item_name) {
          finalizedVendors[vendor.item_name] = {
            id: vendor.id,
            vendor: vendor.vendor || '',
            vendor_website: vendor.vendor_website,
            rating: vendor.rating,
            rating_count: vendor.rating_count,
            item_name: vendor.item_name,
            item_price: vendor.item_price,
            item_unit: vendor.item_unit,
            gst_verified: vendor.gst_verified,
            trustseal_verified: vendor.trustseal_verified,
            member_since: vendor.member_since,
            location: vendor.location,
            contact: vendor.contact,
            email: vendor.email,
            url: vendor.url,
            finalized,
            payment_status: vendor.payment_status,
            delivery_status: vendor.delivery_status,
            notes: vendor.notes
          };
        }
      });
      
      setFinalizedByMaterial(finalizedVendors);
      return finalizedVendors;
    } catch (error) {
      console.error('Error refreshing project vendors:', error);
      return {};
    }
  };

  // Load finalized vendors on component mount
  useEffect(() => {
    // Load vendors when project ID is available
    if (project.id) {
      refreshVendorData();
    }
  }, [project.id]);

  // Refresh vendor data when materials change
  useEffect(() => {
    if (project.id && materials.length > 0) {
      refreshVendorData();
    }
  }, [project.id, materials.length, predictionData?.materials?.length]);
  
  // Refresh vendor data when a vendor is finalized
  useEffect(() => {
    // This effect will trigger whenever finalizedByMaterial changes
    // We don't need to do anything here, but having this ensures
    // the component re-renders when vendors are finalized
  }, [finalizedByMaterial]);

  const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
  ));

  const showSelectedVendor = (material, vendor) => {
    // Set the material we're viewing vendors for
    setSeeVendorsFor(material);
    
    // Since we're using the useVendors hook which manages the vendors state,
    // we need to temporarily set the vendors array to contain just this vendor
    // This is a workaround - in a better implementation, we might want to 
    // have a separate state for viewing selected vendors
  };

  const openFinalize = async (material, vendor) => {
    try {
      // Finalize vendor via API
      await finalizeVendor(vendor.id);
      
      // Ensure only one vendor per material by replacing any existing finalized vendor
      setFinalizedByMaterial(prev => ({ ...prev, [material]: vendor }));
      const materialData = materials.find(m => m.name === material);
      const unitPrice = Math.floor((materialData?.cost || 0) / (materialData?.quantity || 1));
      setManagementData(prev => ({
        ...prev,
        [material]: prev[material] ?? { 
          paymentStatus: "Pending", 
          deliveryDate, 
          deliveryStatus: "Not Started",
          agreementStatus: "Finalized",
          totalAmount: materialData?.cost || 0,
          paymentMade,
          paymentDueDate,
          notes: "", 
          logs: [] 
        },
      }));
      
      // Save vendor to MongoDB with project and material associations
      try {
        const saveResult = await apiService.saveVendor({
          project_id: project.id,  // Associate with current project
          material_name,  // Associate with current material
          name: vendor.vendor,
          website: vendor.vendor_website,
          rating: vendor.rating ? parseFloat(vendor.rating) ,
          rating_count: vendor.rating_count ? parseInt(vendor.rating_count) ,
          item_name: vendor.item_name,
          item_price: vendor.item_price,
          item_unit: vendor.item_unit,
          gst_verified: vendor.gst_verified || false,
          trustseal_verified: vendor.trustseal_verified || false,
          member_since: vendor.member_since,
          location: vendor.location,
          contact: vendor.contact,
          email: vendor.email
        });
        
        if (saveResult.success) {
          toast({
            title: "Vendor saved",
            description: `Vendor ${vendor.vendor} saved for ${material}`,
            variant: "default"
          });
          
          // Refresh vendor data and predictions to ensure consistency
          await refreshVendorData();
          
          // Also refresh predictions to update vendor assignment status
          if (project.id) {
            try {
              const updatedPredictions = await apiService.getPredictions(project.id);
              // We could update the parent component state here if needed
            } catch (error) {
              console.error('Error refreshing predictions:', error);
            }
          }
        } else {
          toast({
            title: "Save failed",
            description: "Failed to save vendor to database",
            variant: "destructive"
          });
        }
      } catch (saveError) {
        console.error('Error saving vendor to MongoDB:', saveError);
        toast({
          title: "Save failed",
          description: "Failed to save vendor to database",
          variant: "destructive"
        });
      }
      
      // Store finalized vendor data for ProcurementTimeline integration
      const finalizedVendors = JSON.parse(localStorage.getItem('finalizedVendors') || '{}');
      finalizedVendors[material] = {
        vendor: vendor.vendor,
        deliveryDate, // Will be set when user updates delivery date in management
        notes: "",
        finalizedAt: new Date().toISOString()
      };
      localStorage.setItem('finalizedVendors', JSON.stringify(finalizedVendors));
      
      // Update the parent component's prediction data to reflect the new vendor assignment
      // This ensures the UI updates immediately without requiring a hard refresh
      if (project.id) {
        try {
          // Refresh predictions to get updated vendor assignment status
          const updatedPredictions = await apiService.getPredictions(project.id);
          // Note: In a real implementation, we would update the parent component state here
          // For now, we'll rely on the local state and useEffect triggers
        } catch (error) {
          console.error('Error refreshing predictions after vendor selection:', error);
        }
      }
    } catch (error) {
      console.error('Error finalizing vendor:', error);
      toast({
        title: "Error",
        description: "Failed to finalize vendor",
        variant: "destructive"
      });
    }
  };

  const addDeliveryLog = (material, quantity, date, note?) => {
    setManagementData(prev => ({
      ...prev,
      [material]: {
        ...(prev[material] ?? { 
          paymentStatus: "Pending", 
          deliveryDate, 
          deliveryStatus: "Not Started",
          agreementStatus: "Finalized",
          totalAmount,
          paymentMade,
          paymentDueDate,
          notes: "", 
          logs: [] 
        }),
        logs: [ ...(prev[material]?.logs ?? []), { quantity, date, note } ],
      },
    }));
  };

  const handleSearchVendors = async (material) => {
    await searchVendors({ 
      material, 
      location: locationFilter || undefined 
    });
    setSeeVendorsFor(material);
  };

  const markPaymentAsPaid = (material) => {
    setManagementData(prev => ({
      ...prev,
      [material]: {
        ...(prev[material] ?? { 
          paymentStatus: "Pending", 
          deliveryDate, 
          deliveryStatus: "Not Started",
          agreementStatus: "Finalized",
          totalAmount,
          paymentMade,
          paymentDueDate,
          notes: "", 
          logs: [] 
        }),
        paymentStatus: "Completed",
        paymentMade: prev[material]?.totalAmount || 0,
      },
    }));
    toast({ title: "Payment marked as completed", description: `Full payment recorded for ${material}` });
  };

  // Show loading state when we expect prediction data but don't have it yet
  if (showPredictionResults && !predictionData) {
    return (
      <div className="tab-content">
        <Card className="dashboard-card">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Loading Materials...</h3>
            <p className="text-muted-foreground mb-4">
              Please wait while we load your project materials.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show a message when there are no predicted materials
  // Only show this message if we have prediction data and it's successful but has no materials
  if (showPredictionResults && predictionData && predictionData.success && predictionData.materials && predictionData.materials.length === 0) {
    return (
      <div className="tab-content">
        <Card className="dashboard-card">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Predicted Materials Found</h3>
            <p className="text-muted-foreground mb-4">
              Please complete the project prediction to see materials and find vendors.
            </p>
            <Button onClick={() => window.location.hash = "#prediction"}>
              Go to Prediction Tab
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <Star className="h-4 w-4" />
                <span className="font-medium">AI Prediction Results</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {predictionData 
                  ? `Found ${materials.length} predicted materials. Search for vendors to get real-time quotes from IndiaMART.`
                  : "Based on your project requirements, we've identified the best vendors for your materials."
                }
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search and Filter */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
          <CardDescription>Track materials, compare vendors, and finalize selections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {predictionData 
                ? `Showing ${materials.length} materials from AI prediction. Click "Find Vendors" to search IndiaMART for each material.`
                : "Track materials, compare vendors, and finalize selections"
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Filter by location (optional)..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card className="dashboard-card mb-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material / Equipment</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Unit Cost (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((m, idx) => {
                  // Check if vendor is assigned either through backend data or local state
                  // Prioritize local state (finalizedByMaterial) over backend data (m.vendorAssigned)
                  // to ensure immediate UI updates after vendor selection
                  const vendorAssigned = finalizedByMaterial[m.name] || m.vendorAssigned || null;
                  
                  const hasVendorAssigned = !!vendorAssigned;
                  
                  return (
                    <motion.tr key={`material-${m.id}-${m.name}-${idx}`} initial={{ opacity, y: 6 }} animate={{ opacity, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.03 }} className={hasVendorAssigned ? "bg-emerald-50 dark:bg-emerald-900/20" : undefined}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {hasVendorAssigned && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {m.name}
                      </TableCell>
                      <TableCell>{m.quantity}</TableCell>
                      <TableCell>{m.unit}</TableCell>
                      <TableCell>₹{Math.round((m.cost || 0) / (m.quantity || 1)).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {hasVendorAssigned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Selected
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not selected</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasVendorAssigned ? (
                          // Show actions for finalized vendors only
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                if (vendorAssigned) {
                                  // Show the selected vendor directly
                                  setSeeVendorsFor(m.name);
                                  // We need to work around the useVendors hook limitation
                                  // For now, we'll just search again to populate the vendors array
                                  // In a better implementation, we would directly set the vendors array
                                  searchVendors({ material: m.name, location: locationFilter || undefined });
                                }
                              }}
                              disabled={loading}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Vendor
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setContactVendor(vendorAssigned)}>
                              <MessageCircle className="h-4 w-4 mr-1" /> Contact Vendor
                            </Button>
                            <Button size="sm" onClick={() => setManageMaterial(m.name)}>Manage</Button>
                          </div>
                        ) : (
                          // Show "Find Vendors" button when no vendor is finalized
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleSearchVendors(m.name)}
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-1" />
                            )}
                            {loading ? 'Searching...' : 'Find Vendors'}
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No materials to display</p>
                    <p className="text-sm mt-1">Complete project prediction to see materials</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vendor selection modal per material */}
      <Dialog open={!!seeVendorsFor} onOpenChange={(open) => !open && setSeeVendorsFor(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendors for {seeVendorsFor}</DialogTitle>
            <DialogDescription>
              {loading ? 'Searching for vendors...' : `Found ${vendors.length} vendors`}
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Searching IndiaMART for vendors...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor, index) => (
                <motion.div
                  key={`vendor-${vendor.id || index}-${vendor.vendor}-${vendor.item_name || 'no-item'}-${index}`}
                  initial={{ opacity, y: 20 }}
                  animate={{ opacity, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex"
                >
                  <Card className="dashboard-card h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/30 flex-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
                            {vendor.vendor}
                          </CardTitle>
                          {vendor.item_name && (
                            <CardDescription className="mt-1 text-sm font-medium text-primary">
                              {vendor.item_name}
                            </CardDescription>
                          )}
                        </div>
                        {(vendor.gst_verified || vendor.trustseal_verified) && (
                          <div className="flex flex-col gap-1">
                            {vendor.gst_verified && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <Shield className="h-3 w-3 mr-1" />
                                GST
                              </Badge>
                            )}
                            {vendor.trustseal_verified && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                <Verified className="h-3 w-3 mr-1" />
                                TrustSEAL
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Rating and Experience */}
                      <div className="flex items-center justify-between">
                        {vendor.rating && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(parseFloat(vendor.rating || '0'))
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{vendor.rating}</span>
                            {vendor.rating_count && (
                              ({vendor.rating_count})</span>
                            )}
                          </div>
                        )}
                        {vendor.member_since && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {vendor.member_since}
                          </Badge>
                        )}
                      </div>

                      {/* Price Information */}
                      {vendor.item_price && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Price</span>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                ₹{vendor.item_price}
                              </div>
                              {vendor.item_unit && (
                                <div className="text-xs text-muted-foreground">
                                  {vendor.item_unit}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {vendor.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {vendor.location}
                          </span>
                        </div>
                      )}

                      {/* Contact Information */}
                      <div className="space-y-2">
                        {vendor.contact && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono">{vendor.contact}</span>
                          </div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm break-all">{vendor.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setContactVendor(vendor)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                        
                        {vendor.vendor_website && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(vendor.vendor_website, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={vendor.finalized}
                          onClick={() => openFinalize(seeVendorsFor!, vendor)}
                        >
                          {vendor.finalized ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Selected
                            </>
                          ) : (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              Select
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          
          {vendors.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                No vendors found for <span className="font-medium">{seeVendorsFor}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria or check back later.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Vendor Modal */}
      <Dialog open={!!contactVendor} onOpenChange={(open) => !open && setContactVendor(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {contactVendor && (
            <>
              <DialogHeader>
                <DialogTitle>Contact {contactVendor.vendor}</DialogTitle>
                <DialogDescription>View vendor details and contact information</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Vendor Name and Item */}
                <div className="space-y-2">
                  <h3 className="font-medium">{contactVendor.vendor}</h3>
                  {contactVendor.item_name && (
                    <p className="text-sm text-muted-foreground">{contactVendor.item_name}</p>
                  )}
                </div>
                
                {/* Verification Badges */}
                <div className="flex flex-wrap gap-2">
                  {contactVendor.gst_verified && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <Shield className="h-3 w-3 mr-1" />
                      GST Verified
                    </Badge>
                  )}
                  {contactVendor.trustseal_verified && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      <Verified className="h-3 w-3 mr-1" />
                      TrustSEAL
                    </Badge>
                  )}
                </div>
                
                {/* Rating */}
                {contactVendor.rating && (
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(parseFloat(contactVendor.rating || '0'))
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{contactVendor.rating}</span>
                    {contactVendor.rating_count && (
                      ({contactVendor.rating_count})</span>
                    )}
                  </div>
                )}
                
                {/* Member Since */}
                {contactVendor.member_since && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Member since {contactVendor.member_since}</span>
                  </div>
                )}
                
                {/* Price Information */}
                {contactVendor.item_price && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          ₹{contactVendor.item_price}
                        </div>
                        {contactVendor.item_unit && (
                          <div className="text-xs text-muted-foreground">
                            {contactVendor.item_unit}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Contact Information */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-medium text-sm">Contact Information</h4>
                  <div className="space-y-2">
                    {contactVendor.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{contactVendor.location}</span>
                      </div>
                    )}
                    {contactVendor.contact && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">{contactVendor.contact}</span>
                      </div>
                    )}
                    {contactVendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm break-all">{contactVendor.email}</span>
                      </div>
                    )}
                    {contactVendor.vendor_website && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <button 
                          className="text-sm text-primary hover:underline"
                          onClick={() => window.open(contactVendor.vendor_website, '_blank')}
                        >
                          Visit Website
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(contactVendor.email || contactVendor.contact || '');
                    toast({ title: "Copied", description: "Contact information copied to clipboard" });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => { 
                    toast({ title: "Contacted", description: `Contact request sent to ${contactVendor.vendor}` }); 
                    setContactVendor(null);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


      {/* Manage modal for a selected material */}
      <Dialog open={!!manageMaterial} onOpenChange={(open) => !open && setManageMaterial(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {manageMaterial && (() => {
            const vendor = finalizedByMaterial[manageMaterial!];
            if (!vendor) return null;
            const m = materials.find(mm => mm.name === manageMaterial);
            const mgmt = managementData[manageMaterial] ?? { 
              paymentStatus: "Pending", 
              deliveryDate, 
              deliveryStatus: "Not Started",
              agreementStatus: "Finalized",
              totalAmount: m?.cost || 0,
              paymentMade,
              paymentDueDate,
              notes: "", 
              logs: [] 
            };
            const unitPrice = m ? Math.floor((m.cost || 0) / (m.quantity || 1)) ;
            const paymentDue = mgmt.totalAmount - mgmt.paymentMade;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Manage {manageMaterial}
                  </DialogTitle>
                  <DialogDescription>Vendor: {vendor.vendor}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Vendor Name</Label>
                        <div className="text-base font-medium">{vendor.vendor}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Material / Equipment</Label>
                        <div className="text-base font-medium">{manageMaterial}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Quantity + Unit</Label>
                        <div className="text-base font-medium">{m?.quantity} {m?.unit}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Unit Price</Label>
                        <div className="text-base font-medium">₹{unitPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Cost</Label>
                        <div className="text-base font-medium">₹{mgmt.totalAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Contact Info</Label>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {vendor.contact}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Procurement Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Procurement Status</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Agreement Status</Label>
                        <Select value={mgmt.agreementStatus} onValueChange={(val) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryDate, deliveryStatus: "Not Started", totalAmount, paymentMade, paymentDueDate, notes: "", logs: [] }), agreementStatus: val as any } }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Finalized">Finalized</SelectItem>
                            <SelectItem value="Pending Confirmation">Pending Confirmation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                        <div>
                          <Label>Delivery Date</Label>
                          <Input
                            type="date"
                            value={mgmt.deliveryDate ? mgmt.deliveryDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const newDate = e.target.value ? new Date(e.target.value) ;
                              setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount, paymentMade, paymentDueDate, notes: "", logs: [] }), deliveryDate: newDate } }));
                              
                              // Update localStorage for ProcurementTimeline integration
                              const finalizedVendors = JSON.parse(localStorage.getItem('finalizedVendors') || '{}');
                              if (finalizedVendors[manageMaterial]) {
                                finalizedVendors[manageMaterial].deliveryDate = newDate?.toISOString() || null;
                                localStorage.setItem('finalizedVendors', JSON.stringify(finalizedVendors));
                              }
                            }}
                          />
                        </div>
                      <div>
                        <Label>Delivery Status</Label>
                        <Select value={mgmt.deliveryStatus} onValueChange={(val) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryDate, agreementStatus: "Finalized", totalAmount, paymentMade, paymentDueDate, notes: "", logs: [] }), deliveryStatus: val as any } }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Tracking */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                          <div className="text-lg font-semibold">₹{mgmt.totalAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Payment Made</Label>
                          <div className="text-lg font-semibold text-emerald-600">₹{mgmt.paymentMade.toLocaleString()}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Payment Due</Label>
                          <div className="text-lg font-semibold text-orange-600">₹{paymentDue.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Payment Status</Label>
                          <Select value={mgmt.paymentStatus} onValueChange={(val) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { deliveryDate, deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount, paymentMade, paymentDueDate, notes: "", logs: [] }), paymentStatus: val as any } }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Payment Due Date</Label>
                          <Input
                            type="date"
                            value={mgmt.paymentDueDate ? mgmt.paymentDueDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryDate, deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount, paymentMade, notes: "", logs: [] }), paymentDueDate: e.target.value ? new Date(e.target.value) : null } }))}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input 
                            type="date" 
                            placeholder="Payment date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full" 
                          />
                          <Input 
                            type="number" 
                            placeholder="Payment amount" 
                            className="w-full" 
                            max={paymentDue}
                          />
                          <Button 
                            onClick={(e) => {
                              const parentElement = e.currentTarget.parentElement;
                              if (!parentElement) return;
                              
                              const dateInput = parentElement.children[0] as HTMLInputElement;
                              const amountInput = parentElement.children[1] as HTMLInputElement;
                              
                              const amount = Number(amountInput.value);
                              const dateStr = dateInput.value;
                              
                              if (!isNaN(amount) && amount > 0 && amount <= paymentDue && dateStr) {
                                const paymentDate = new Date(dateStr);
                                setManagementData(prev => ({
                                  ...prev,
                                  [manageMaterial]: {
                                    ...(prev[manageMaterial] ?? { paymentStatus: "Pending", deliveryDate, deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount, paymentMade, paymentDueDate, notes: "", logs: [] }),
                                    paymentMade: (prev[manageMaterial]?.paymentMade || 0) + amount,
                                    paymentStatus: amount + (prev[manageMaterial]?.paymentMade || 0) >= mgmt.totalAmount ? "Completed" : "Partially Paid"
                                  }
                                }));
                                amountInput.value = "";
                                toast({ title: "Payment recorded", description: `₹${amount.toLocaleString()} payment recorded for ${manageMaterial} on ${paymentDate.toDateString()}` });
                              } else {
                                toast({ 
                                  title: "Invalid input", 
                                  description: "Please enter a valid date and amount",
                                  variant: "destructive"
                                });
                              }
                            }}
                            disabled={mgmt.paymentStatus === "Completed"}
                            className="w-full"
                          >
                            Record Payment
                          </Button>
                        </div>
                        <Button 
                          onClick={() => markPaymentAsPaid(manageMaterial)}
                          disabled={mgmt.paymentStatus === "Completed"}
                          className="w-full"
                          variant="outline"
                        >
                          Mark Fully Paid
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="text-sm font-medium">Initial Total</div>
                          <div className="text-sm">₹{mgmt.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="text-sm font-medium">Payments Made</div>
                          <div className="text-sm text-emerald-600">₹{mgmt.paymentMade.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center justify-between pb-2">
                          <div className="text-sm font-medium">Balance Due</div>
                          <div className="text-sm text-orange-600">₹{paymentDue.toLocaleString()}</div>
                        </div>
                        {mgmt.paymentMade > 0 && (
                          <div className="pt-2">
                            <div className="text-xs text-muted-foreground mb-1">Payment History:</div>
                            <div className="text-xs bg-muted/50 p-2 rounded">
                              Payment of ₹{mgmt.paymentMade.toLocaleString()} recorded
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        placeholder="Add remarks (e.g., 'Advance paid', 'Delay expected')"
                        value={mgmt.notes}
                        onChange={(e) => setManagementData(prev => ({ ...prev, [manageMaterial]: { ...(prev[manageMaterial!] ?? { paymentStatus: "Pending", deliveryDate, deliveryStatus: "Not Started", agreementStatus: "Finalized", totalAmount, paymentMade, paymentDueDate, logs: [] }), notes: e.target.value } }))}
                      />
                    </CardContent>
                  </Card>

                  {/* Delivery Logs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Delivery Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mgmt.logs.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No delivery logs yet</div>}
                        {mgmt.logs.map((log, i) => (
                          <motion.div 
                            key={`log-${manageMaterial}-${i}-${log.date.getTime()}-${log.quantity}`} 
                            initial={{ opacity, y: 10 }} 
                            animate={{ opacity, y: 0 }}
                            className="border rounded-md p-3 bg-muted/50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{log.date.toDateString()}</div>
                              <div className="text-sm text-muted-foreground">{log.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="text-sm">
                                <span className="font-medium">{log.quantity}</span> {m?.unit}
                              </div>
                              {log.note && <div className="text-xs text-muted-foreground">- {log.note}</div>}
                            </div>
                          </motion.div>
                        ))}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2">
                          <Input 
                            type="date" 
                            className="w-full" 
                            defaultValue={new Date().toISOString().split('T')[0]}
                          />
                          <Input 
                            type="number" 
                            placeholder="Quantity" 
                            className="w-full" 
                          />
                          <Input 
                            type="text" 
                            placeholder="Note (optional)" 
                            className="w-full" 
                          />
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              if (!manageMaterial) return;
                              const parentElement = e.currentTarget.parentElement;
                              if (!parentElement) return;
                              
                              const dateInput = parentElement.children[0] as HTMLInputElement;
                              const quantityInput = parentElement.children[1] as HTMLInputElement;
                              const noteInput = parentElement.children[2] as HTMLInputElement;
                              
                              const qty = Number(quantityInput.value);
                              const note = noteInput.value;
                              const dateStr = dateInput.value;
                              
                              if (!isNaN(qty) && qty > 0 && dateStr) {
                                const date = new Date(dateStr);
                                addDeliveryLog(manageMaterial, qty, date, note);
                                quantityInput.value = "";
                                noteInput.value = "";
                                toast({ title: "Delivery log added", description: `Added delivery log for ${qty} ${m?.unit} on ${date.toDateString()}` });
                              } else {
                                toast({ 
                                  title: "Invalid input", 
                                  description: "Please enter a valid date and quantity",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Add Entry
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">
                        
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this vendor?")) {
                              setFinalizedByMaterial(prev => {
                                const newState = { ...prev };
                                delete newState[manageMaterial];
                                return newState;
                              });
                              setManageMaterial(null);
                              toast({ title: "Vendor removed", description: `${vendor.vendor} removed from ${manageMaterial}` });
                            }
                          }}
                        >
                          Remove / Replace Vendor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setManageMaterial(null)}>Close</Button>
                  <Button onClick={() => { toast({ title: "Saved", description: `Management details saved for ${manageMaterial}` }); setManageMaterial(null); }}>Save Changes</Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}
