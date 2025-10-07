import type { ApiError, ListParams } from '../types';

const API_BASE_URL = 'https://o0w8wocb5g.execute-api.ap-south-1.amazonaws.com/api/elite';

export class ApiService {
  private static token: string | null = null;
  static readonly defaultList: Required<Pick<ListParams, 'page' | 'pageSize' | 'sortDir'>> = {
    page: 1,
    pageSize: 20,
    sortDir: 'desc',
  };

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

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
  }

  // Internal unified fetch
  private static async request<T>(path: string, init?: RequestInit): Promise<T> {
    try {
      const isFormData = typeof FormData !== 'undefined' && (init?.body instanceof FormData);
      const baseHeaders: Record<string, string> = { ...this.getAuthHeaders() };
      // Only set JSON content-type when not sending FormData and when caller didn't override
      if (!isFormData) {
        const provided = init?.headers as Record<string, string> | undefined;
        const hasCT = provided && Object.keys(provided).some(k => k.toLowerCase() === 'content-type');
        if (!hasCT) baseHeaders['Content-Type'] = 'application/json';
      }
      const headers = { ...baseHeaders, ...(init?.headers as any) } as HeadersInit;

      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
      });

      if (res.status === 401) {
        this.clearToken();
      }

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : await res.text();

      if (!res.ok) {
        const err: ApiError = {
          status: res.status,
          message: (data && (data.message || data.error)) || 'Request failed',
        };
        throw err;
      }
      return data as T;
    } catch (e: any) {
      // Surface aborted requests distinctly so callers can ignore them
      if (e?.name === 'AbortError' || /aborted/i.test(e?.message || '')) {
        const err: ApiError & { aborted?: boolean } = { message: e?.message || 'Request aborted', code: 'ABORTED' } as any;
        (err as any).aborted = true;
        throw err as any;
      }
      if (e && e.message && e.status !== undefined) throw e as ApiError;
      const err: ApiError = { message: e?.message || 'Network error' };
      throw err;
    }
  }

  // Authentication APIs
  static async login(email: string, password: string) {
    return this.request<any>('/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  static async verifyOTP(email: string, otp: string) {
    return this.request<any>('/user/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
  }

  // Product APIs
  static buildQuery(params?: Record<string, any>) {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      q.append(k, String(v));
    });
    const qs = q.toString();
    return qs ? `?${qs}` : '';
  }

  static async getAllProducts(params?: ListParams, options?: { signal?: AbortSignal }) {
    const { page, pageSize, q, sortBy, sortDir } = { ...this.defaultList, ...params };
    const query = this.buildQuery({ page, limit: pageSize, q, sortBy, sortDir });
    return this.request<any>(`/product/all${query}`, { signal: options?.signal });
  }

  // Product search API (optimized, dedicated endpoint)
  static async searchProducts(params: { q: string; page?: number; limit?: number }, options?: { signal?: AbortSignal }) {
    const { q, page = 1, limit = 20 } = params;
    const query = this.buildQuery({ q, page, limit });
    return this.request<any>(`/product/search${query}`, { signal: options?.signal });
  }

  static async getProduct(id: string) {
  return this.request<any>(`/product/${id}`);
  }

  static async addProduct(productData: any) {
    return this.request<any>('/product/add', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  static async updateProduct(id: string, productData: any) {
    return this.request<any>(`/product/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  static async deleteProduct(id: string) {
  return this.request<any>(`/product/delete/${id}`, { method: 'DELETE' });
  }

  static async bulkDeleteProducts(ids: string[]) {
    return this.request<any>('/product/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  static async bulkUploadProducts(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    // For multipart, override default content type
    return this.request<any>('/product/bulk/add', {
      method: 'POST',
      headers: { ...this.getAuthHeaders() },
      body: formData as any,
    });
  }

  static async getUploadBatches() {
  return this.request<any>('/product/bulk/batches');
  }

  static async rollbackUpload(uploadId: string) {
  return this.request<any>(`/product/bulk/rollback/${uploadId}`, { method: 'DELETE' });
  }

  // Order APIs
  static async createOrder(orderData: {
    items: { product: string; qty: number; price: number }[];
    customerPhone?: string;
    paymentMethod: 'CASH' | 'UPI';
    discount?: number;
    notes?: string;
  }) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  static async getAllOrders(params?: {
    from?: string;
    to?: string;
    paymentStatus?: 'PENDING' | 'PAID' | 'CANCELLED';
  } & ListParams, options?: { signal?: AbortSignal }) {
    const { page, pageSize, sortBy, sortDir } = { ...this.defaultList, ...params };
    const query = this.buildQuery({
      from: params?.from,
      to: params?.to,
      paymentStatus: params?.paymentStatus,
      page,
      limit: pageSize,
      sortBy,
      sortDir,
    });
    return this.request<any>(`/orders${query}`, { signal: options?.signal });
  }

  static async getOrder(id: string) {
  return this.request<any>(`/orders/${id}`);
  }

  static async updateOrder(id: string, orderData: any) {
    return this.request<any>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  static async deleteOrder(id: string) {
  return this.request<any>(`/orders/${id}`, { method: 'DELETE' });
  }

  static async cancelOrder(id: string) {
  return this.request<any>(`/orders/${id}/cancel`, { method: 'PUT' });
  }

  // Invoice API
  static async getInvoiceData(orderId: string) {
    return this.request<InvoiceData>(`/orders/${orderId}/invoice`);
  }
}