// API service for communicating with FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Vendor {
  id: number;
  vendor: string;
  vendor_website?: string;
  rating?: string;
  rating_count?: string;
  item_name?: string;
  item_price?: string;
  item_unit?: string;
  gst_verified?: boolean;
  trustseal_verified?: boolean;
  member_since?: string;
  location: string;
  contact?: string;
  email?: string;
  url?: string;
  finalized: boolean;
  payment_status: string;
  delivery_status: string;
  notes?: string;
}

export interface VendorSearchParams {
  material: string;
  location?: string;
}

export interface VendorUpdateData {
  finalized?: boolean;
  payment_status?: string;
  delivery_status?: string;
  notes?: string;
}

export interface VendorSaveData {
  project_id?: string;
  material_id?: string;
  material_name?: string;
  name: string;
  website?: string;
  rating?: number;
  rating_count?: number;
  item_name?: string;
  item_price?: string;
  item_unit?: string;
  gst_verified?: boolean;
  trustseal_verified?: boolean;
  member_since?: string;
  location: string;
  contact?: string;
  email?: string;
}

// Material prediction interfaces
export interface ProjectRequest {
  projectType: string;
  size: string;
  state: string;
  city: string;
  volume: string;
}

export interface MaterialPrediction {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  cost: number;
  vendorAssigned?: Vendor; // Change to full vendor object instead of just ID
}

export interface PredictionResponse {
  success: boolean;
  materials: MaterialPrediction[];
  total_cost: number;
  confidence: number;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request(
    endpoint,
    options = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Search for vendors based on material and location
  async searchVendors(params): Promise<Vendor[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('material', params.material);
    if (params.location) {
      searchParams.append('location', params.location);
    }

    return this.request(`/vendors?${searchParams.toString()}`);
  }

  // Finalize a vendor
  async finalizeVendor(vendorId): Promise<{ message: string }> {
    return this.request(`/vendors/finalize/${vendorId}`, {
      method: 'POST',
    });
  }

  // Update vendor information
  async updateVendor(vendorId, data): Promise<{ message: string }> {
    return this.request(`/vendors/${vendorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Get all finalized vendors
  async getFinalizedVendors(): Promise<Vendor[]> {
    return this.request('/vendors/finalized');
  }

  // Health check
  async healthCheck(): Promise<{ message: string; version: string }> {
    return this.request('/');
  }

  // Material prediction
  async predictMaterials(projectData): Promise<PredictionResponse> {
    return this.request('/predict', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // Test prediction with detailed output
  async testPrediction(projectData): Promise<any> {
    return this.request('/test-prediction', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // MongoDB Project Management
  async createProject(projectData): Promise<{ success: boolean; project_id: string; message: string }> {
    console.log('Creating project with data:', projectData);
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getAllProjects(): Promise<any[]> {
    return this.request('/projects');
  }

  async getProject(projectId): Promise<any> {
    return this.request(`/projects/${projectId}`);
  }

  // Save and retrieve predictions from MongoDB
  async savePrediction(projectId, predictionData): Promise<{ success: boolean; prediction_id: string; message: string }> {
    return this.request(`/projects/${projectId}/predictions`, {
      method: 'POST',
      body: JSON.stringify(predictionData),
    });
  }

  async getPredictions(projectId): Promise<PredictionResponse> {
    return this.request(`/projects/${projectId}/predictions`);
  }

  // Save vendor data to MongoDB
  async saveVendor(vendorData): Promise<{ success: boolean; vendor_id: string; message: string }> {
    return this.request('/vendors/save', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });
  }

  // Get vendors associated with a specific project
  async getProjectVendors(projectId, materialName?): Promise<Vendor[]> {
    const searchParams = new URLSearchParams();
    if (materialName) {
      searchParams.append('material_name', materialName);
    }
    return this.request(`/projects/${projectId}/vendors?${searchParams.toString()}`);
  }

  // Assign vendor to material
  async assignVendorToMaterial(projectId, materialId, vendorId): Promise<{ message: string }> {
    return this.request(`/projects/${projectId}/materials/${materialId}/assign-vendor?vendor_id=${vendorId}`, {
      method: 'PATCH',
    });
  }

  // User Authentication
  async registerUser(userData: { username: string; email: string; password: string }): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { username: string; password: string }): Promise<any> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
