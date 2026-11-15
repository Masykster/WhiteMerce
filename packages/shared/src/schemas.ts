import { z } from "zod";
import {
  DEFAULT_CURRENCY,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PRODUCT_STATUSES,
  SUPPORTED_CURRENCIES,
} from "./constants";

export const currencySchema = z
  .enum(SUPPORTED_CURRENCIES)
  .default(DEFAULT_CURRENCY);

export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const productFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(100).optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  status: productStatusSchema.optional(),
  sort: z
    .enum(["newest", "price-asc", "price-desc", "name-asc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export const variantMutationSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(2, "SKU is required").max(64),
  name: z.string().trim().min(1, "Variant name is required").max(100),
  options: z.record(z.string().trim().min(1), z.string().trim().min(1)).default({}),
  priceCents: z.coerce
    .number()
    .int("Price must be an integer in USD cents")
    .min(50, "Minimum variant price is $0.50 (50 cents)")
    .max(10_000_000),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").max(100_000),
  isDefault: z.boolean().default(false),
});

export const productMutationSchema = z.object({
  categoryId: z.string().uuid("Select a valid category").nullable().optional(),
  name: z.string().trim().min(2, "Product name is required").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(160)
    .regex(slugRegex, "Slug must contain lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(4000),
  basePriceCents: z.coerce
    .number()
    .int("Base price must be an integer in USD cents")
    .min(50, "Minimum price is $0.50 (50 cents)")
    .max(10_000_000),
  status: productStatusSchema.default("draft"),
  featured: z.boolean().default(false),
  images: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .refine(
          (value) =>
            value.startsWith("/images/") ||
            value.startsWith("https://") ||
            value.startsWith("http://"),
          "Image must be a local /images/... path or valid http(s) URL",
        ),
    )
    .min(1, "At least one product image is required")
    .max(8),
  variants: z
    .array(variantMutationSchema)
    .min(1, "At least one product variant is required")
    .max(30),
});

export const categoryMutationSchema = z.object({
  name: z.string().trim().min(2, "Category name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(slugRegex, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().trim().max(500).nullable().optional(),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("/images/") ||
        value.startsWith("https://") ||
        value.startsWith("http://"),
      "Invalid image path or URL",
    )
    .nullable()
    .optional(),
});

export const cartItemInputSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const shippingAddressSchema = z.object({
  line1: z.string().trim().min(4, "Street address is required").max(160),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State / Province is required").max(80),
  postalCode: z.string().trim().min(3, "Postal code is required").max(20),
  country: z.string().trim().min(2, "Country is required").max(60),
});

export const checkoutRequestSchema = z.object({
  items: z
    .array(cartItemInputSchema)
    .min(1, "Your cart is empty")
    .max(50, "Too many items in one checkout"),
  currency: currencySchema,
  customerName: z.string().trim().min(2, "Full name is required").max(120),
  customerEmail: z.string().trim().email("Enter a valid email address").max(160),
  shippingAddress: shippingAddressSchema,
});

export const devConfirmCheckoutSchema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  token: z.string().trim().min(8).max(128),
  action: z.enum(["pay", "cancel"]).default("pay"),
});

export const orderLookupSchema = z
  .object({
    orderNumber: z.string().trim().min(4).max(40).optional(),
    email: z.string().trim().email("Enter a valid email address").optional(),
    sessionId: z.string().trim().min(6).max(200).optional(),
  })
  .refine(
    (data) => Boolean(data.sessionId || (data.orderNumber && data.email)),
    "Provide either sessionId or both orderNumber and email",
  );

export const orderStatusUpdateSchema = z.object({
  status: orderStatusSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email address").max(160),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type ProductMutationInput = z.infer<typeof productMutationSchema>;
export type VariantMutationInput = z.infer<typeof variantMutationSchema>;
export type CategoryMutationInput = z.infer<typeof categoryMutationSchema>;
export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;
export type DevConfirmCheckoutInput = z.infer<typeof devConfirmCheckoutSchema>;
export type OrderLookupInput = z.infer<typeof orderLookupSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
