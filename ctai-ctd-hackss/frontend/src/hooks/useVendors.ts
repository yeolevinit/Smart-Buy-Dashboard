import { useState, useEffect, useCallback } from 'react';
import { apiService, Vendor, VendorSearchParams, VendorUpdateData } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface UseVendorsReturn {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  searchVendors: (params: VendorSearchParams) => Promise<void>;
  finalizeVendor: (vendorId: number) => Promise<void>;
  updateVendor: (vendorId: number, data: VendorUpdateData) => Promise<void>;
  refreshVendors: () => Promise<void>;
}

export function useVendors(): UseVendorsReturn {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchVendors = useCallback(async (params: VendorSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await apiService.searchVendors(params);
      setVendors(results);
      
      if (results.length === 0) {
        toast({
          title: "No vendors found",
          description: `No vendors found for ${params.material}${params.location ? ` in ${params.location}` : ''}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Vendors found",
          description: `Found ${results.length} vendors for ${params.material}`,
          variant: "default"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search vendors';
      setError(errorMessage);
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const finalizeVendor = useCallback(async (vendorId: number) => {
    try {
      // Use updateVendor to set finalized status instead of separate finalize endpoint
      await updateVendor(vendorId, { finalized: true });
      
      // Update local state
      setVendors(prev => 
        prev.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, finalized: true }
            : vendor
        )
      );
      
      const vendor = vendors.find(v => v.id === vendorId);
      toast({
        title: "Vendor finalized",
        description: `${vendor?.vendor || 'Vendor'} has been finalized`,
        variant: "default"
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to finalize vendor';
      toast({
        title: "Finalization failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [vendors, toast]);

  const updateVendor = useCallback(async (vendorId: number, data: VendorUpdateData) => {
    try {
      await apiService.updateVendor(vendorId, data);
      
      // Update local state
      setVendors(prev => 
        prev.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, ...data }
            : vendor
        )
      );
      
      toast({
        title: "Vendor updated",
        description: "Vendor information has been updated successfully",
        variant: "default"
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vendor';
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  const refreshVendors = useCallback(async () => {
    // This could be used to refresh the current search results
    // For now, we'll just clear the current vendors
    setVendors([]);
  }, []);

  return {
    vendors,
    loading,
    error,
    searchVendors,
    finalizeVendor,
    updateVendor,
    refreshVendors
  };
}
