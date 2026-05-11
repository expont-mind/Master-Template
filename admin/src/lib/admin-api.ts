/**
 * Admin API Client
 *
 * This client communicates with the admin API routes that use service_role
 * to bypass RLS policies. Use this for all admin panel data operations.
 */

const API_BASE = "/api/admin";

export interface AdminApiOptions {
  select?: string;
  order?: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, string>;
}

export interface AdminApiError {
  error: string;
}

function isError(data: unknown): data is AdminApiError {
  return typeof data === "object" && data !== null && "error" in data;
}

function buildQueryString(options?: AdminApiOptions): string {
  if (!options) return "";

  const params = new URLSearchParams();

  if (options.select) {
    params.set("select", options.select);
  }

  if (options.order) {
    params.set("order", options.order);
  }

  if (options.limit) {
    params.set("limit", options.limit.toString());
  }

  if (options.offset) {
    params.set("offset", options.offset.toString());
  }

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const adminApi = {
  /**
   * Fetch all records from a table
   */
  async getAll<T>(table: string, options?: AdminApiOptions): Promise<T[]> {
    const queryString = buildQueryString(options);
    const res = await fetch(`${API_BASE}/${table}${queryString}`);
    const data = await res.json();

    if (isError(data)) {
      throw new Error(data.error);
    }

    return data as T[];
  },

  /**
   * Fetch a single record by ID
   */
  async getById<T>(table: string, id: string, options?: { select?: string }): Promise<T> {
    const queryString = options?.select ? `?select=${encodeURIComponent(options.select)}` : "";
    const res = await fetch(`${API_BASE}/${table}/${id}${queryString}`);
    const data = await res.json();

    if (isError(data)) {
      throw new Error(data.error);
    }

    return data as T;
  },

  /**
   * Insert a new record
   */
  async insert<T>(table: string, record: Partial<T>): Promise<T> {
    const res = await fetch(`${API_BASE}/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const data = await res.json();

    if (isError(data)) {
      throw new Error(data.error);
    }

    return data as T;
  },

  /**
   * Insert multiple records at once
   */
  async bulkInsert<T>(table: string, records: Partial<T>[]): Promise<T[]> {
    const res = await fetch(`${API_BASE}/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    });
    const data = await res.json();

    if (isError(data)) {
      throw new Error(data.error);
    }

    return data as T[];
  },

  /**
   * Update an existing record
   */
  async update<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
    const res = await fetch(`${API_BASE}/${table}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();

    if (isError(data)) {
      throw new Error(data.error);
    }

    return data as T;
  },

  /**
   * Delete a record
   */
  async delete(table: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${table}/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (isError(data)) {
      throw new Error(data.error);
    }
  },

  /**
   * Fetch with custom select (for joins)
   * Example: adminApi.select("orders", "*, users(*), order_items(*)")
   */
  async select<T>(table: string, select: string, options?: Omit<AdminApiOptions, "select">): Promise<T[]> {
    return this.getAll<T>(table, { ...options, select });
  },

  /**
   * Fetch paginated records with total count
   */
  async getAllPaginated<T>(
    table: string,
    options?: AdminApiOptions
  ): Promise<{ data: T[]; totalCount: number | null }> {
    // Build filter params shared by both queries
    const filterParams = new URLSearchParams();
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        filterParams.set(key, value);
      });
    }

    // Data query: full select with joins, no count
    const dataParams = new URLSearchParams(filterParams);
    if (options?.select) dataParams.set("select", options.select);
    if (options?.order) dataParams.set("order", options.order);
    if (options?.limit) dataParams.set("limit", options.limit.toString());
    if (options?.offset !== undefined && options?.offset !== null) dataParams.set("offset", options.offset.toString());

    // Count query: lightweight select (no joins), count only
    const countParams = new URLSearchParams(filterParams);
    countParams.set("select", "id");
    countParams.set("count", "exact");
    countParams.set("limit", "0");
    countParams.set("offset", "0");

    const [dataRes, countRes] = await Promise.all([
      fetch(`${API_BASE}/${table}?${dataParams.toString()}`),
      fetch(`${API_BASE}/${table}?${countParams.toString()}`),
    ]);

    const data = await dataRes.json();
    if (isError(data)) {
      throw new Error(data.error);
    }

    let totalCount: number | null = null;
    const countData = await countRes.json();
    if (!isError(countData)) {
      const totalCountHeader = countRes.headers.get("X-Total-Count");
      totalCount = totalCountHeader ? parseInt(totalCountHeader, 10) : null;
    }

    return { data: data as T[], totalCount };
  },

  /**
   * Fetch ALL records by batching paginated requests (bypasses 1000 row default limit).
   *
   * Hard-capped at MAX_ROWS to prevent the analytics tab from pulling
   * the entire orders table into the browser when filters are wide
   * (mirrors the banners-storm pattern that caused the production
   * outage — same shape, different table). When the cap is hit the
   * `truncated` flag in the result lets callers warn users.
   */
  async getAllBatched<T>(
    table: string,
    options?: Omit<AdminApiOptions, "limit" | "offset"> & { maxRows?: number }
  ): Promise<T[]> {
    const result = await this.getAllBatchedWithMeta<T>(table, options);
    return result.data;
  },

  async getAllBatchedWithMeta<T>(
    table: string,
    options?: Omit<AdminApiOptions, "limit" | "offset"> & { maxRows?: number }
  ): Promise<{ data: T[]; truncated: boolean; totalCount: number | null }> {
    const BATCH_SIZE = 500;
    const MAX_ROWS = options?.maxRows ?? Infinity;
    const allData: T[] = [];
    let offset = 0;
    let hasMore = true;
    let lastTotalCount: number | null = null;
    let truncated = false;

    while (hasMore) {
      const { data, totalCount } = await this.getAllPaginated<T>(table, {
        ...options,
        limit: BATCH_SIZE,
        offset,
      });
      lastTotalCount = totalCount;
      allData.push(...data);
      offset += BATCH_SIZE;
      hasMore = totalCount !== null ? offset < totalCount : data.length === BATCH_SIZE;

      if (allData.length >= MAX_ROWS) {
        truncated = true;
        break;
      }
    }

    return {
      data: allData.slice(0, MAX_ROWS),
      truncated,
      totalCount: lastTotalCount,
    };
  },

  /**
   * Call a server-side RPC function
   */
  async rpc<T>(fn: string, params?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${API_BASE}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fn, params }),
    });
    const data = await res.json();

    if (isError(data)) {
      throw new Error(data.error);
    }

    return data as T;
  },
};

// Type-safe table-specific helpers
export const adminOrders = {
  getAll: (options?: AdminApiOptions) =>
    adminApi.getAll("orders", options),

  getById: (id: string, options?: { select?: string }) =>
    adminApi.getById("orders", id, options),

  update: (id: string, data: { status?: string; payment_status?: string; updated_at?: string }) =>
    adminApi.update("orders", id, data),

  getWithDetails: (options?: Omit<AdminApiOptions, "select">) =>
    adminApi.select(
      "orders",
      "*, users(id, first_name, last_name, email, primary_phone), order_items(id, quantity)",
      options
    ),
};

export const adminUsers = {
  getAll: (options?: AdminApiOptions) =>
    adminApi.getAll("users", options),

  getById: (id: string) =>
    adminApi.getById("users", id),

  update: (id: string, data: { status?: string; updated_at?: string }) =>
    adminApi.update("users", id, data),
};

export const adminProducts = {
  getAll: (options?: AdminApiOptions) =>
    adminApi.getAll("products", options),

  getById: (id: string, options?: { select?: string }) =>
    adminApi.getById("products", id, options),

  insert: (data: { name: string; price: number; [key: string]: unknown }) =>
    adminApi.insert("products", data),

  update: (id: string, data: Record<string, unknown>) =>
    adminApi.update("products", id, data),

  delete: (id: string) =>
    adminApi.delete("products", id),
};

export const adminReviews = {
  getAll: (options?: AdminApiOptions) =>
    adminApi.getAll("reviews", options),

  getById: (id: string, options?: { select?: string }) =>
    adminApi.getById("reviews", id, options),

  update: (id: string, data: { status?: string; updated_at?: string }) =>
    adminApi.update("reviews", id, data),

  getWithDetails: (options?: Omit<AdminApiOptions, "select">) =>
    adminApi.select(
      "reviews",
      "*, users(id, first_name, last_name, email), products(id, name)",
      options
    ),
};

export const adminFaqs = {
  getAll: (options?: AdminApiOptions) =>
    adminApi.getAll("faqs", options),

  getById: (id: string) =>
    adminApi.getById("faqs", id),

  insert: (data: { question: string; answer: string; category?: string; status?: string; sort_order?: number }) =>
    adminApi.insert("faqs", data),

  update: (id: string, data: Record<string, unknown>) =>
    adminApi.update("faqs", id, data),

  delete: (id: string) =>
    adminApi.delete("faqs", id),
};

export const adminArticles = {
  getAll: (options?: AdminApiOptions) =>
    adminApi.getAll("articles", options),

  getById: (id: string) =>
    adminApi.getById("articles", id),

  insert: (data: { title: string; content?: string; slug?: string; status?: string }) =>
    adminApi.insert("articles", data),

  update: (id: string, data: Record<string, unknown>) =>
    adminApi.update("articles", id, data),

  delete: (id: string) =>
    adminApi.delete("articles", id),
};

export const adminCategories = {
  getAll: (options?: AdminApiOptions) =>
    adminApi.getAll("categories", options),

  insert: (data: { name: string; parent_id?: string | null }) =>
    adminApi.insert("categories", data),

  update: (id: string, data: { name?: string; parent_id?: string | null }) =>
    adminApi.update("categories", id, data),

  delete: (id: string) =>
    adminApi.delete("categories", id),
};

export const adminBrands = {
  getAll: (options?: AdminApiOptions) =>
    adminApi.getAll("brands", options),

  insert: (data: { name: string; logo_url?: string }) =>
    adminApi.insert("brands", data),

  update: (id: string, data: { name?: string; logo_url?: string }) =>
    adminApi.update("brands", id, data),

  delete: (id: string) =>
    adminApi.delete("brands", id),
};
