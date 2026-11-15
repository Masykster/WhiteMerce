import type {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
  SupportedCurrency,
} from "./constants";

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount?: number;
}

export interface ProductVariantDto {
  id: string;
  productId: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  priceCents: number; // Canonical USD cents
  stock: number;
  isDefault: boolean;
}

export interface ProductDto {
  id: string;
  categoryId: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  name: string;
  slug: string;
  description: string;
  basePriceCents: number; // Canonical USD cents
  status: ProductStatus;
  featured: boolean;
  images: string[];
  variants: ProductVariantDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProductsDto {
  items: ProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItemDto {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantName: string;
  sku: string;
  unitPriceUsdCents: number;
  quantity: number;
  imageUrl: string;
  maxStock: number;
}

export interface ShippingAddressDto {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItemDto {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string;
  sku: string;
  unitPriceAmount: number;
  unitPriceUsdCents: number;
  quantity: number;
  lineTotalAmount: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddressDto;
  currency: SupportedCurrency;
  exchangeRate: number;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  totalUsdCents: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
}

export interface CheckoutSessionResponseDto {
  orderNumber: string;
  checkoutUrl: string;
  paymentProvider: PaymentProvider;
  currency: SupportedCurrency;
  totalAmount: number;
}

export interface DailyRevenuePointDto {
  date: string;
  revenueUsdCents: number;
  ordersCount: number;
}

export interface AnalyticsOverviewDto {
  totalRevenueUsdCents: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  activeProductsCount: number;
  lowStockVariantsCount: number;
  dailyRevenue: DailyRevenuePointDto[];
  recentOrders: Array<Omit<OrderDto, "items" | "shippingAddress">>;
}
