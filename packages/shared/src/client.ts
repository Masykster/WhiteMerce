import type {
  CategoryDto,
  CheckoutSessionResponseDto,
  OrderDto,
  PaginatedProductsDto,
  ProductDto,
} from "./types";
import type {
  CheckoutRequestInput,
  DevConfirmCheckoutInput,
  OrderLookupInput,
  ProductFilterInput,
} from "./schemas";

export class WhiteMerceApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "WhiteMerceApiError";
    this.status = status;
    this.details = details;
  }
}

export interface WhiteMerceClientConfig {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function createWhiteMerceClient(config: WhiteMerceClientConfig) {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const fetcher = config.fetchImpl ?? fetch;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? ((await response.json()) as { error?: string; details?: unknown })
      : null;

    if (!response.ok) {
      throw new WhiteMerceApiError(
        payload?.error ?? `Request failed with status ${response.status}`,
        response.status,
        payload?.details,
      );
    }

    return payload as T;
  }

  return {
    listCategories(): Promise<{ items: CategoryDto[] }> {
      return request("/api/v1/categories");
    },

    listProducts(filter: Partial<ProductFilterInput> = {}): Promise<PaginatedProductsDto> {
      const qs = buildQuery({
        q: filter.q,
        category: filter.category,
        featured: filter.featured,
        sort: filter.sort,
        page: filter.page,
        limit: filter.limit,
      });
      return request(`/api/v1/products${qs}`);
    },

    getProductBySlug(slug: string): Promise<{ product: ProductDto }> {
      return request(`/api/v1/products/${encodeURIComponent(slug)}`);
    },

    createCheckout(input: CheckoutRequestInput): Promise<CheckoutSessionResponseDto> {
      return request("/api/v1/checkout", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    confirmDevCheckout(input: DevConfirmCheckoutInput): Promise<{ order: OrderDto }> {
      return request("/api/v1/checkout/dev-confirm", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    getDevCheckoutOrder(orderNumber: string, token: string): Promise<{ order: OrderDto }> {
      const qs = buildQuery({ orderNumber, token });
      return request(`/api/v1/checkout/dev-confirm${qs}`);
    },

    lookupOrder(input: OrderLookupInput): Promise<{ order: OrderDto }> {
      const qs = buildQuery({
        orderNumber: input.orderNumber,
        email: input.email,
        sessionId: input.sessionId,
      });
      return request(`/api/v1/orders/lookup${qs}`);
    },
  };
}
