const API_BASE_URL = 'https://pos-backend-3d2k.onrender.com/api/elite';

export class ApiService {
  private static token: string | null = null;

  static setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth-token', token);
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth-token');
    }
    return this.token;
  }

  static clearToken() {
    this.token = null;
    localStorage.removeItem('auth-token');
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Authentication APIs
  static async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  static async verifyOTP(email: string, otp: string) {
    const response = await fetch(`${API_BASE_URL}/user/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      throw new Error('OTP verification failed');
    }

    return response.json();
  }

  // Product APIs
  static async getAllProducts() {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/product/all`, {
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async getProduct(id: string) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/product/${id}`, {
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async addProduct(productData: any) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/product/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productData),
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async updateProduct(id: string, productData: any) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/product/update/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(productData),
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async deleteProduct(id: string) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/product/delete/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async bulkUploadProducts(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/product/bulk/add`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async getUploadBatches() {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/product/bulk/batches`, {
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async rollbackUpload(uploadId: string) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/product/bulk/rollback/${uploadId}`, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  // Order APIs
  static async createOrder(orderData: {
    items: { product: string; qty: number; price: number }[];
    customerPhone?: string;
    paymentMethod: 'CASH' | 'UPI';
    discount?: number;
    notes?: string;
  }) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async getAllOrders(params?: {
    from?: string;
    to?: string;
    paymentStatus?: 'PENDING' | 'PAID' | 'CANCELLED';
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async getOrder(id: string) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async updateOrder(id: string, orderData: any) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(orderData),
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async deleteOrder(id: string) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  static async cancelOrder(id: string) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    const response = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
      method: 'PUT',
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Authentication required');
    }

    return response.json();
  }
}