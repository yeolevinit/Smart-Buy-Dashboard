// API service for communicating with FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  baseUrl;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
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
  async searchVendors(params) {
    const searchParams = new URLSearchParams();
    searchParams.append('material', params.material);
    if (params.location) {
      searchParams.append('location', params.location);
    }

    return this.request(`/vendors?${searchParams.toString()}`);
  }

  // Finalize a vendor
  async finalizeVendor(vendorId) {
    return this.request(`/vendors/finalize/${vendorId}`, {
      method: 'POST',
    });
  }

  // Update vendor information
  async updateVendor(vendorId, data) {
    return this.request(`/vendors/${vendorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Get all finalized vendors
  async getFinalizedVendors() {
    return this.request('/vendors/finalized');
  }

  // Health check
  async healthCheck() {
    return this.request('/');
  }

  // Material prediction
  async predictMaterials(projectData) {
    return this.request('/predict', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // Test prediction with detailed output
  async testPrediction(projectData) {
    return this.request('/test-prediction', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // MongoDB Project Management
  async createProject(projectData) {
    console.log('Creating project with data:', projectData);
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getAllProjects() {
    return this.request('/projects');
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  // Save and retrieve predictions from MongoDB
  async savePrediction(projectId, predictionData) {
    return this.request(`/projects/${projectId}/predictions`, {
      method: 'POST',
      body: JSON.stringify(predictionData),
    });
  }

  async getPredictions(projectId) {
    return this.request(`/projects/${projectId}/predictions`);
  }

  // Save vendor data to MongoDB
  async saveVendor(vendorData) {
    return this.request('/vendors/save', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });
  }

  // Get vendors associated with a specific project
  async getProjectVendors(projectId, materialName) {
    const searchParams = new URLSearchParams();
    if (materialName) {
      searchParams.append('material_name', materialName);
    }
    return this.request(`/projects/${projectId}/vendors?${searchParams.toString()}`);
  }

  // Assign vendor to material
  async assignVendorToMaterial(projectId, materialId, vendorId) {
    return this.request(`/projects/${projectId}/materials/${materialId}/assign-vendor?vendor_id=${vendorId}`, {
      method: 'PATCH',
    });
  }

  // User Authentication
  async registerUser(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
