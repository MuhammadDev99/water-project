export * from "./auth";
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  uuid,
  decimal,
  varchar,
  jsonb,
  customType,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { user } from "./auth";
import { z } from "zod/v4";

// ============================================================================
// SHARED CUSTOM TYPES
// ============================================================================
/** Store money as integer cents to avoid floating-point errors (1050 = $10.50) */
export const cents = customType<{ data: number; driverData: number }>({
  dataType() {
    return "integer";
  },
  fromDriver(value: number): number {
    return value / 100;
  },
  toDriver(value: number): number {
    return Math.round(value * 100);
  },
});

// ============================================================================
// ENUMS
// ============================================================================

export const frequencyEnum = pgEnum("frequency", ["daily", "every_other_day", "weekly", "biweekly", "monthly"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled", "failed"]);

export const driverStatusEnum = pgEnum("driver_status", ["active", "inactive", "on_leave"]);
export const addressTypeEnum = pgEnum("address_type", ["home", "work", "other"]);
export const couponTypeEnum = pgEnum("coupon_type", ["percentage", "fixed", "free_delivery"]);

// NEW ENUMS FOR EDGE CASES
export const bottleTransactionReasonEnum = pgEnum("bottle_transaction_reason", ["initial_deposit", "delivery_return", "lost_bottle", "admin_adjustment"]);
export const paymentMethodEnum = pgEnum("payment_method", ["card", "cash_on_delivery", "wallet"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "captured", "failed", "refunded", "partially_refunded"]);
export const attemptStatusEnum = pgEnum("attempt_status", ["success", "customer_unavailable", "address_unreachable", "vehicle_breakdown", "other"]);

// ============================================================================
// 1. ADDRESSES
// ============================================================================
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

  city: text("city").notNull(),
  district: text("district").notNull(),
  street: text("street").notNull(),
  buildingNumber: varchar("building_number", { length: 64 }).notNull(),
  apartmentFloor: varchar("apartment_floor", { length: 128 }),
  landmark: text("landmark"),
  postalCode: varchar("postal_code", { length: 16 }),
  countryCode: varchar("country_code", { length: 2 }).default("SA").notNull(),

  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),

  addressType: addressTypeEnum("address_type").default("home").notNull(),
  label: varchar("label", { length: 128 }),
  recipientName: text("recipient_name").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  displayAddress: text("display_address").notNull(),

  // Timezones added for correct global timestamping
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 2. DRIVERS & ZONES
// ============================================================================
export const drivers = pgTable("drivers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  status: driverStatusEnum("status").notNull().default("active"),
  vehiclePlate: varchar("vehicle_plate", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export const selectDriverSchema = createSelectSchema(drivers);
export type Driver = z.infer<typeof selectDriverSchema>;
export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: text("driver_id").notNull().references(() => drivers.id, { onDelete: "cascade" }),
  zoneName: text("zone_name").notNull(),
  polygonCoords: jsonb("polygon_coords").$type<{ type: "Polygon"; coordinates: number[][][] }>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 3. PRODUCTS
// ============================================================================
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  price: cents("price").notNull(),
  depositAmount: cents("deposit_amount").default(0).notNull(),
  bottlesPerUnit: integer("bottles_per_unit").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 4. SUBSCRIPTIONS
// ============================================================================
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  addressId: uuid("address_id").notNull().references(() => addresses.id, { onDelete: "restrict" }),
  productId: uuid("product_id").notNull().references(() => products.id),

  frequency: frequencyEnum("frequency").notNull(),
  quantityPerDelivery: integer("quantity_per_delivery").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),

  // Replaced naive strings with timezone-aware expectations for cron jobs
  expectedNextProcessAt: timestamp("expected_next_process_at", { withTimezone: true }).notNull(),
  lastProcessedAt: timestamp("last_processed_at", { withTimezone: true }),
  preferredTimeSlot: varchar("preferred_time_slot", { length: 32 }),

  pausedUntil: timestamp("paused_until", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 5. COUPONS
// ============================================================================
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: couponTypeEnum("type").notNull(),
  value: cents("value"),
  minOrder: cents("min_order").default(0),

  // EDGE CASE: Stop percentage coupons from bleeding money
  maxDiscountAmount: cents("max_discount_amount"),
  isFirstOrderOnly: boolean("is_first_order_only").notNull().default(false),
  validProductIds: jsonb("valid_product_ids").$type<string[]>(), // specific products only

  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  globalUsageLimit: integer("global_usage_limit"),
  customerUsageLimit: integer("customer_usage_limit").default(1),
  usedCount: integer("used_count").default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 6. ORDERS & ITEMS
// ============================================================================
export const orders = pgTable("orders", {
  // ==========================================
  // 1. IDENTIFIERS
  // ==========================================
  id: uuid("id").primaryKey().defaultRandom(),

  // Idempotency Key to prevent double charges on network failure
  idempotencyKey: varchar("idempotency_key", { length: 128 }).unique(),
  orderReference: text("order_reference").notNull().unique(),

  // ==========================================
  // 2. RELATIONSHIPS & SNAPSHOTS
  // ==========================================
  userId: text("user_id").notNull().references(() => user.id),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),

  addressId: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot").notNull().default({}),
  driverId: text("driver_id").references(() => drivers.id, { onDelete: "set null" }),

  // ==========================================
  // 3. SCHEDULING
  // ==========================================
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  preferredTimeSlot: varchar("preferred_time_slot", { length: 32 }),

  // ==========================================
  // 4. FINANCIAL BREAKDOWN (Paid Online)
  // ==========================================
  currency: varchar("currency", { length: 3 }).notNull().default("SAR"),
  subtotalAmount: cents("subtotal_amount").notNull().default(0),
  deliveryAmount: cents("delivery_amount").notNull().default(0),
  depositAmount: cents("deposit_amount").notNull().default(0), // Deposit paid *at checkout*
  discountAmount: cents("discount_amount").notNull().default(0),
  taxAmount: cents("tax_amount").notNull().default(0),
  totalAmount: cents("total_amount").notNull().default(0),

  // ==========================================
  // 5. RECONCILIATION (Happens at the door)
  // ==========================================
  // Cash driver collected for missing empty bottles (or extra items requested)
  driverCollectedCash: cents("driver_collected_cash").notNull().default(0),

  // Money owed back to customer if they lacked cash/empties and driver withheld bottles
  refundedAmount: cents("refunded_amount").notNull().default(0),

  // ==========================================
  // 6. DISCOUNTS
  // ==========================================
  couponId: integer("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  appliedCouponCode: text("applied_coupon_code"),

  // ==========================================
  // 7. STATUSES & CONTEXT
  // ==========================================
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),

  customerNote: text("customer_note"),
  staffNote: text("staff_note"),
  cancelReason: text("cancel_reason"),

  // ==========================================
  // 8. PROOF OF DELIVERY
  // ==========================================
  deliveryPhotoUrl: text("delivery_photo_url"),
  deliverySignatureUrl: text("delivery_signature_url"),

  // ==========================================
  // 9. TIMESTAMPS
  // ==========================================
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
});
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),

  // --- 1. WHAT WAS ORDERED ---
  quantity: integer("quantity").notNull(),
  expectedEmptiesToReturn: integer("expected_empties_to_return").notNull().default(0),

  // --- 2. WHAT ACTUALLY HAPPENED AT THE DOOR (Filled by Driver App) ---
  actualEmptiesReturned: integer("actual_empties_returned").notNull().default(0),

  // NEW: If customer didn't have empties or cash, the driver delivers fewer bottles!
  deliveredQuantity: integer("delivered_quantity").notNull().default(0),

  // FINANCES
  priceAtPurchase: cents("price_at_purchase").notNull(),
  taxAtPurchase: cents("tax_at_purchase").notNull().default(0),
  depositAtPurchase: cents("deposit_at_purchase").notNull().default(0),
});

// ============================================================================
// 7. PAYMENTS (New Table for Refund/COD tracking)
// ============================================================================
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  amount: cents("amount").notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  providerReference: varchar("provider_reference", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 8. BOTTLE LEDGER (New Table - Replaces `emptyBottlesOnHand`)
// ============================================================================
export const bottleLedger = pgTable("bottle_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),

  // Positive = gave bottle to customer. Negative = customer returned bottle.
  quantityChange: integer("quantity_change").notNull(),
  depositValueApplied: cents("deposit_value_applied").notNull().default(0),

  reason: bottleTransactionReasonEnum("reason").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 9. DELIVERY ATTEMPTS (New Table - Driver "Not Home" tracking)
// ============================================================================
export const deliveryAttempts = pgTable("delivery_attempts", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  driverId: text("driver_id").notNull().references(() => drivers.id),

  status: attemptStatusEnum("status").notNull(),
  driverNotes: text("driver_notes"),

  gpsLatitudeRecorded: decimal("gps_lat_recorded", { precision: 10, scale: 8 }),
  gpsLongitudeRecorded: decimal("gps_lng_recorded", { precision: 11, scale: 8 }),
  photoProofUrl: text("photo_proof_url"),

  attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 10. USER PREFERENCES
// ============================================================================
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  defaultAddressId: uuid("default_address_id").references(() => addresses.id, { onDelete: "set null" }),
  smsNotifications: boolean("sms_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  preferredTimeSlot: varchar("preferred_time_slot", { length: 32 }),
});

// ============================================================================
// ZOD SCHEMAS (Server-action validation)
// ============================================================================

export const insertOrderSchema = createInsertSchema(orders, {
  customerNote: z.string().max(500, "Note too long").optional(),
  orderReference: z.string().min(1),
  shippingAddressSnapshot: z.record(z.string(), z.unknown()),
}).extend({
  // Make idempotency required from the frontend submission
  idempotencyKey: z.string().uuid("Must provide a valid UUID idempotency key"),
});
export const selectOrderSchema = createSelectSchema(orders);
export type Order = z.infer<typeof selectOrderSchema>;

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  // These keys must match the keys inside your orderItems table definition
  quantity: (s) => s.min(1, "Quantity must be at least 1").max(200),

  // We validate the EXPECTED count (what the user says they have)
  expectedEmptiesToReturn: (s) => s.min(0),

  // We validate the ACTUAL count (what the driver actually gets)
  actualEmptiesReturned: (s) => s.min(0),
});
export const selectOrderItemSchema = createSelectSchema(orderItems);
export type OrderItem = z.infer<typeof selectOrderItemSchema>;
export type NewOrderItem = z.infer<typeof insertOrderItemSchema>;

export const insertAddressSchema = createInsertSchema(addresses, {
  phoneNumber: (s) => s.min(9, "Phone number too short"),
  latitude: (s) => s.min(-90).max(90),
  longitude: (s) => s.min(-180).max(180),
});
export const selectAddressSchema = createSelectSchema(addresses);
export type Address = z.infer<typeof selectAddressSchema>;

export const insertSubscriptionSchema = createInsertSchema(subscriptions, {
  quantityPerDelivery: (s) => s.min(1, "Must deliver at least 1 bottle").max(50),
});
export const selectSubscriptionSchema = createSelectSchema(subscriptions);
export type Subscription = z.infer<typeof selectSubscriptionSchema>;

export const insertCouponSchema = createInsertSchema(coupons, {
  code: (s) => s.min(3).max(32).toUpperCase(),
  validProductIds: z.array(z.string().uuid()).optional(),
});
export const selectCouponSchema = createSelectSchema(coupons);
export type Coupon = z.infer<typeof selectCouponSchema>;

// Ledger validation
export const insertBottleLedgerSchema = createInsertSchema(bottleLedger);
export const selectBottleLedgerSchema = createSelectSchema(bottleLedger);
export type BottleLedger = z.infer<typeof selectBottleLedgerSchema>;

// Payment validation
export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);
export type Payment = z.infer<typeof selectPaymentSchema>;

// Delivery Attempts Validation
export const insertDeliveryAttemptSchema = createInsertSchema(deliveryAttempts);
export const selectDeliveryAttemptSchema = createSelectSchema(deliveryAttempts);
export type DeliveryAttempt = z.infer<typeof selectDeliveryAttemptSchema>;

// Add Product schemas (Missing in your current file)
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type Product = z.infer<typeof selectProductSchema>;


// packages/db/schema.ts

// 1. Add these new enums
export const rewardTypeEnum = pgEnum("reward_type", ["discount_percent", "discount_fixed", "free_product", "other"]);
export const pointTransactionReasonEnum = pgEnum("point_transaction_reason", ["order_completed", "reward_redemption", "admin_adjustment", "signup_bonus"]);

// 2. Add the Rewards Catalog table
export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  rewardType: rewardTypeEnum("reward_type").notNull(),
  rewardValue: integer("reward_value").notNull(), // Amount in cents OR percentage (e.g., 15 for 15%)
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }), // For free product
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  usageLimitPerUser: integer("usage_limit_per_user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Add the Loyalty Points Ledger table (tracks balance mathematically)
export const loyaltyPointsLedger = pgTable("loyalty_points_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  pointsChange: integer("points_change").notNull(), // Positive to add, negative to deduct
  reason: pointTransactionReasonEnum("reason").notNull(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Add the Reward Redemptions table (links to coupons)
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  rewardId: uuid("reward_id").notNull().references(() => rewards.id, { onDelete: "restrict" }),
  couponId: integer("coupon_id").references(() => coupons.id, { onDelete: "set null" }), // Auto-generates a coupon for them to use at checkout
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).defaultNow().notNull(),
});


// packages/db/schema.ts

// Add to your enums at the top
export const notificationTypeEnum = pgEnum("notification_type", ["info", "promo", "order", "alert"]);

// Add the table definition
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 128 }).notNull(),
  body: text("body").notNull(),
  type: notificationTypeEnum("type").notNull().default("info"),

  // Stores extra JSON data (e.g., { "orderId": "123", "deepLink": "app://orders/123" })
  data: jsonb("data").$type<Record<string, unknown>>().default({}),

  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});