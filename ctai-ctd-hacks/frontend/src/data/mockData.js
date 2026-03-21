// Mock data for the AI Procurement Management Platform

// Mock materials prediction data
export const mockMaterials = [
  { id: '1', name: 'Structural Steel', quantity: 450, unit: 'tons', cost: 56000000, category: 'Structure' },
  { id: '2', name: 'Concrete (M40)', quantity: 2800, unit: 'm³', cost: 32000000, category: 'Foundation' },
  { id: '3', name: 'Glass Curtain Wall', quantity: 1200, unit: 'm²', cost: 75000000, category: 'Exterior' },
  { id: '4', name: 'HVAC Systems', quantity: 24, unit: 'units', cost: 28000000, category: 'MEP' },
  { id: '5', name: 'Electrical Conduits', quantity: 5500, unit: 'm', cost: 6200000, category: 'Electrical' },
  { id: '6', name: 'Fire Safety Systems', quantity: 8, unit: 'systems', cost: 13500000, category: 'Safety' },
  { id: '7', name: 'Insulation Materials', quantity: 3200, unit: 'm²', cost: 4800000, category: 'Interior' },
  { id: '8', name: 'Plumbing Fixtures', quantity: 180, unit: 'units', cost: 9800000, category: 'MEP' },
];

// Mock vendors data
export const mockVendors = [
  {
    id: '1',
    name: 'Tata Steel Ltd.',
    location: 'Jamshedpur, Jharkhand',
    contact: '+91 657 242 0123',
    email: 'orders@tatasteel.com',
    materials: ['Structural Steel', 'Metal Frameworks'],
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Ultratech Concrete Supplies',
    location: 'Mumbai, Maharashtra',
    contact: '+91 22 4002 4500',
    email: 'supply@ultratechconcrete.in',
    materials: ['Concrete (M40)', 'Precast Elements'],
    rating: 4.6,
  },
  {
    id: '3',
    name: 'Saint-Gobain Glass India',
    location: 'Chennai, Tamil Nadu',
    contact: '+91 44 2376 5900',
    email: 'sales@saint-gobain.co.in',
    materials: ['Glass Curtain Wall', 'Windows', 'Glazing'],
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Blue Star HVAC',
    location: 'Ahmedabad, Gujarat',
    contact: '+91 79 6600 4000',
    email: 'info@bluestarindia.com',
    materials: ['HVAC Systems', 'Ventilation', 'Air Conditioning'],
    rating: 4.7,
  },
  {
    id: '5',
    name: 'Havells India Electricals',
    location: 'Noida, Uttar Pradesh',
    contact: '+91 120 333 1000',
    email: 'orders@havells.com',
    materials: ['Electrical Conduits', 'Wiring', 'Electrical Panels'],
    rating: 4.5,
  },
];

// Mock procurement timeline data
export const mockProcurementItems = [
  {
    id: '1',
    material: 'Structural Steel',
    orderBy: new Date('2025-08-25'),
    deliveryStart: new Date('2025-09-10'),
    deliveryEnd: new Date('2025-09-25'),
    status: 'critical',
    vendor: 'Tata Steel Ltd.',
  },
  {
    id: '2',
    material: 'Concrete (M40)',
    orderBy: new Date('2025-09-05'),
    deliveryStart: new Date('2025-09-20'),
    deliveryEnd: new Date('2025-10-05'),
    status: 'on-track',
    vendor: 'Ultratech Concrete Supplies',
  },
  {
    id: '3',
    material: 'Glass Curtain Wall',
    orderBy: new Date('2025-10-01'),
    deliveryStart: new Date('2025-10-20'),
    deliveryEnd: new Date('2025-11-05'),
    status: 'warning',
    vendor: 'Saint-Gobain Glass India',
  },
  {
    id: '4',
    material: 'HVAC Systems',
    orderBy: new Date('2025-11-10'),
    deliveryStart: new Date('2025-12-01'),
    deliveryEnd: new Date('2025-12-15'),
    status: 'on-track',
    vendor: 'Blue Star HVAC',
  },
];

// Mock chat messages — isUser is a plain boolean value per message
export const mockChatMessages = [
  {
    id: '1',
    message: 'Hello! I can help you with procurement planning and material optimization. What would you like to know?',
    isUser: false,
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: '2',
    message: 'What are the most cost-effective alternatives for structural steel in my project?',
    isUser: true,
    timestamp: new Date('2024-01-15T10:01:00'),
  },
  {
    id: '3',
    message: 'Based on current market trends, I recommend ordering steel materials 2 weeks earlier than planned due to supply chain constraints.',
    isUser: false,
    timestamp: new Date('2024-01-15T10:01:30'),
  },
];

// Mock API simulation
export const mockApiCall = async (endpoint, data) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  switch (endpoint) {
    case '/predict':
      return {
        success: true,
        materials: mockMaterials,
        timeline: mockProcurementItems,
        totalCost: mockMaterials.reduce((sum, m) => sum + m.cost, 0),
        estimatedDuration: '6 months',
      };

    case '/chatbot': {
      const responses = [
        'I can help you optimise your procurement strategy. What specific aspect would you like to focus on?',
        'Based on current market trends, I recommend ordering steel materials 2 weeks earlier than planned due to supply chain constraints.',
        'Your current timeline looks feasible. However, I suggest adding a 10% buffer for critical path items.',
        'Would you like me to analyse alternative suppliers for cost optimisation?',
      ];
      return {
        success: true,
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
    }

    default:
      return { success: false, error: 'Unknown endpoint' };
  }
};