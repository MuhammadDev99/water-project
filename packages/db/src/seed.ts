/**
 * seed.ts
 * Run with: npx tsx packages/db/seed.ts
 *
 * Seeds the database with realistic dev data:
 *   - 1 admin user + 3 customer users (via better-auth user table)
 *   - 2 drivers with delivery zones
 *   - 4 products (water bottle SKUs)
 *   - 3 addresses (one per customer)
 *   - 1 subscription
 *   - 3 coupons (percentage, fixed, free_delivery)
 *   - 5 orders with order items
 *   - Payments for completed orders
 *   - Bottle ledger entries
 *   - User preferences
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { randomUUID } from "crypto";

import {
  user,
  addresses,
  drivers,
  deliveryZones,
  products,
  subscriptions,
  coupons,
  orders,
  orderItems,
  payments,
  bottleLedger,
  userPreferences,
} from "./schemas";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert SAR to cents (integer) */
const sar = (amount: number) => Math.round(amount);

function orderRef() {
  return "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function cleanDatabase() {
  console.log("🗑️  Emptying existing database tables...");

  const tables = [
    "user_preferences",
    "bottle_ledger",
    "payments",
    "order_items",
    "orders",
    "coupons",
    "subscriptions",
    "products",
    "delivery_zones",
    "drivers",
    "addresses",
    "session",
    "account",
    "verification",
    "user",
  ];

  for (const table of tables) {
    try {
      // We use sql.raw because table names in TRUNCATE must be identifiers
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`));
    } catch (e) {
      console.error(`⚠️ Could not truncate ${table}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log("✨ Database cleaned.\n");
}
async function main() {
  await cleanDatabase()
  console.log("🌱 Seeding database...\n");
  // ──────────────────────────────────────────────
  // 1. USERS  (better-auth `user` table)
  // ──────────────────────────────────────────────

  const adminId = randomUUID();
  const customer1Id = randomUUID();
  const customer2Id = randomUUID();
  const customer3Id = randomUUID();

  const seedUsers = [
    {
      id: adminId,
      name: "Admin User",
      email: "admin@water.dev",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: customer1Id,
      name: "Ahmed Al-Rashidi",
      email: "ahmed@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: customer2Id,
      name: "Sara Al-Otaibi",
      email: "sara@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: customer3Id,
      name: "Khalid Mansour",
      email: "khalid@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.insert(user).values(seedUsers).onConflictDoNothing();
  console.log(`✅ Users (${seedUsers.length})`);

  // ──────────────────────────────────────────────
  // 2. DRIVERS
  // ──────────────────────────────────────────────

  const driver1Id = "driver-001";
  const driver2Id = "driver-002";

  await db
    .insert(drivers)
    .values([
      {
        id: driver1Id,
        name: "Mohammed Al-Zahrani",
        phone: "+966501111001",
        status: "active",
        vehiclePlate: "ABC-1234",
        notes: "North Riyadh route",
      },
      {
        id: driver2Id,
        name: "Faisal Al-Ghamdi",
        phone: "+966501111002",
        status: "active",
        vehiclePlate: "XYZ-5678",
        notes: "South Riyadh route",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Drivers (2)");

  // ──────────────────────────────────────────────
  // 3. DELIVERY ZONES
  // ──────────────────────────────────────────────

  await db
    .insert(deliveryZones)
    .values([
      {
        driverId: driver1Id,
        zoneName: "North Riyadh",
        polygonCoords: {
          type: "Polygon",
          coordinates: [
            [
              [46.6, 24.8],
              [46.8, 24.8],
              [46.8, 25.0],
              [46.6, 25.0],
              [46.6, 24.8],
            ],
          ],
        },
      },
      {
        driverId: driver2Id,
        zoneName: "South Riyadh",
        polygonCoords: {
          type: "Polygon",
          coordinates: [
            [
              [46.6, 24.5],
              [46.8, 24.5],
              [46.8, 24.7],
              [46.6, 24.7],
              [46.6, 24.5],
            ],
          ],
        },
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Delivery zones (2)");

  // ──────────────────────────────────────────────
  // 4. PRODUCTS
  // ──────────────────────────────────────────────

  const product1Id = randomUUID();
  const product2Id = randomUUID();
  const product3Id = randomUUID();
  const product4Id = randomUUID();

  await db
    .insert(products)
    .values([
      {
        id: product1Id,
        name: "Standard 5L Water Bottle",
        description: "Pure still water, 5-litre refillable bottle.",
        price: sar(8),
        depositAmount: sar(20),
        bottlesPerUnit: 1,
        isActive: true,
        sortOrder: 1,
      },
      {
        id: product2Id,
        name: "Family 10L Water Bottle",
        description: "Large 10-litre bottle, perfect for families.",
        price: sar(14),
        depositAmount: sar(35),
        bottlesPerUnit: 1,
        isActive: true,
        sortOrder: 2,
      },
      {
        id: product3Id,
        name: "Office Dispenser 19L",
        description: "Standard office dispenser gallon – 19 litres.",
        price: sar(25),
        depositAmount: sar(50),
        bottlesPerUnit: 1,
        isActive: true,
        sortOrder: 3,
      },
      {
        id: product4Id,
        name: "Sparkling Water 1.5L (6-pack)",
        description: "Carbonated mineral water, 1.5L × 6 bottles.",
        price: sar(30),
        depositAmount: sar(0),
        bottlesPerUnit: 6,
        isActive: true,
        sortOrder: 4,
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Products (4)");

  // ──────────────────────────────────────────────
  // 5. ADDRESSES
  // ──────────────────────────────────────────────

  const addr1Id = randomUUID();
  const addr2Id = randomUUID();
  const addr3Id = randomUUID();

  await db
    .insert(addresses)
    .values([
      {
        id: addr1Id,
        userId: customer1Id,
        city: "Riyadh",
        district: "Al Malaz",
        street: "King Fahd Road",
        buildingNumber: "12",
        apartmentFloor: "Floor 3",
        landmark: "Beside Al Malaz Park",
        postalCode: "11411",
        countryCode: "SA",
        latitude: "24.6900",
        longitude: "46.7200",
        addressType: "home",
        label: "Home",
        recipientName: "Ahmed Al-Rashidi",
        phoneNumber: "+966501234001",
        displayAddress: "12 King Fahd Road, Al Malaz, Riyadh 11411",
      },
      {
        id: addr2Id,
        userId: customer2Id,
        city: "Riyadh",
        district: "Al Nakheel",
        street: "Prince Sultan Street",
        buildingNumber: "45",
        apartmentFloor: null,
        landmark: "Near Al Nakheel Mall",
        postalCode: "13321",
        countryCode: "SA",
        latitude: "24.7800",
        longitude: "46.6800",
        addressType: "home",
        label: "Home",
        recipientName: "Sara Al-Otaibi",
        phoneNumber: "+966501234002",
        displayAddress: "45 Prince Sultan St, Al Nakheel, Riyadh 13321",
      },
      {
        id: addr3Id,
        userId: customer3Id,
        city: "Riyadh",
        district: "Al Olaya",
        street: "Olaya Main Street",
        buildingNumber: "88",
        apartmentFloor: "Floor 7",
        landmark: "Kingdom Tower vicinity",
        postalCode: "12244",
        countryCode: "SA",
        latitude: "24.6910",
        longitude: "46.6850",
        addressType: "work",
        label: "Office",
        recipientName: "Khalid Mansour",
        phoneNumber: "+966501234003",
        displayAddress: "88 Olaya St, Al Olaya, Riyadh 12244",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Addresses (3)");

  // ──────────────────────────────────────────────
  // 6. SUBSCRIPTIONS
  // ──────────────────────────────────────────────

  const sub1Id = randomUUID();

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await db
    .insert(subscriptions)
    .values([
      {
        id: sub1Id,
        userId: customer1Id,
        addressId: addr1Id,
        productId: product3Id,
        frequency: "weekly",
        quantityPerDelivery: 2,
        isActive: true,
        expectedNextProcessAt: nextWeek,
        preferredTimeSlot: "morning",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Subscriptions (1)");

  // ──────────────────────────────────────────────
  // 7. COUPONS
  // ──────────────────────────────────────────────

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  await db
    .insert(coupons)
    .values([
      {
        name: "New Customer 15% Off",
        code: "WELCOME15",
        type: "percentage",
        value: sar(15),
        minOrder: sar(30),
        maxDiscountAmount: sar(50),
        isFirstOrderOnly: true,
        globalUsageLimit: 500,
        customerUsageLimit: 1,
        usedCount: 42,
        enabled: true,
        endDate: futureDate,
      },
      {
        name: "SAR 10 Off",
        code: "SAVE10",
        type: "fixed",
        value: sar(10),
        minOrder: sar(50),
        isFirstOrderOnly: false,
        globalUsageLimit: 200,
        customerUsageLimit: 2,
        usedCount: 10,
        enabled: true,
        endDate: futureDate,
      },
      {
        name: "Free Delivery",
        code: "FREEDEL",
        type: "free_delivery",
        value: null,
        minOrder: sar(20),
        isFirstOrderOnly: false,
        globalUsageLimit: null,
        customerUsageLimit: 3,
        usedCount: 5,
        enabled: true,
        endDate: futureDate,
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Coupons (3)");

  // ──────────────────────────────────────────────
  // 8. ORDERS & ORDER ITEMS
  // ──────────────────────────────────────────────

  const addressSnapshot1 = {
    city: "Riyadh",
    district: "Al Malaz",
    street: "King Fahd Road",
    buildingNumber: "12",
    displayAddress: "12 King Fahd Road, Al Malaz, Riyadh 11411",
    recipientName: "Ahmed Al-Rashidi",
    phoneNumber: "+966501234001",
  };
  const addressSnapshot2 = {
    city: "Riyadh",
    district: "Al Nakheel",
    street: "Prince Sultan Street",
    buildingNumber: "45",
    displayAddress: "45 Prince Sultan St, Al Nakheel, Riyadh 13321",
    recipientName: "Sara Al-Otaibi",
    phoneNumber: "+966501234002",
  };

  // --- Order 1: delivered, cash on delivery ---
  const order1Id = randomUUID();
  await db.insert(orders).values({
    id: order1Id,
    idempotencyKey: randomUUID(),
    orderReference: orderRef(),
    userId: customer1Id,
    addressId: addr1Id,
    shippingAddressSnapshot: addressSnapshot1,
    driverId: driver1Id,
    currency: "SAR",
    subtotalAmount: sar(25),
    deliveryAmount: sar(5),
    depositAmount: sar(50),
    discountAmount: sar(0),
    taxAmount: sar(2.25),
    totalAmount: sar(82.25),
    driverCollectedCash: sar(82.25),
    refundedAmount: sar(0),
    status: "delivered",
    paymentStatus: "captured",
    deliveredAt: new Date(),
  });
  await db.insert(orderItems).values([
    {
      orderId: order1Id,
      productId: product3Id,
      quantity: 1,
      expectedEmptiesToReturn: 1,
      actualEmptiesReturned: 1,
      deliveredQuantity: 1,
      priceAtPurchase: sar(25),
      taxAtPurchase: sar(2.25),
      depositAtPurchase: sar(50),
    },
  ]);

  // --- Order 2: pending, card ---
  const order2Id = randomUUID();
  await db.insert(orders).values({
    id: order2Id,
    idempotencyKey: randomUUID(),
    orderReference: orderRef(),
    userId: customer2Id,
    addressId: addr2Id,
    shippingAddressSnapshot: addressSnapshot2,
    driverId: null,
    currency: "SAR",
    subtotalAmount: sar(8),
    deliveryAmount: sar(5),
    depositAmount: sar(20),
    discountAmount: sar(0),
    taxAmount: sar(0.72),
    totalAmount: sar(33.72),
    driverCollectedCash: sar(0),
    refundedAmount: sar(0),
    status: "pending",
    paymentStatus: "pending",
  });
  await db.insert(orderItems).values([
    {
      orderId: order2Id,
      productId: product1Id,
      quantity: 1,
      expectedEmptiesToReturn: 0,
      actualEmptiesReturned: 0,
      deliveredQuantity: 0,
      priceAtPurchase: sar(8),
      taxAtPurchase: sar(0.72),
      depositAtPurchase: sar(20),
    },
  ]);

  // --- Order 3: confirmed, assigned to driver2 ---
  const order3Id = randomUUID();
  await db.insert(orders).values({
    id: order3Id,
    idempotencyKey: randomUUID(),
    orderReference: orderRef(),
    userId: customer3Id,
    addressId: addr3Id,
    shippingAddressSnapshot: {
      city: "Riyadh",
      district: "Al Olaya",
      street: "Olaya Main Street",
      buildingNumber: "88",
      displayAddress: "88 Olaya St, Al Olaya, Riyadh 12244",
      recipientName: "Khalid Mansour",
      phoneNumber: "+966501234003",
    },
    driverId: driver2Id,
    currency: "SAR",
    subtotalAmount: sar(44),
    deliveryAmount: sar(5),
    depositAmount: sar(70),
    discountAmount: sar(10),
    taxAmount: sar(3.5),
    totalAmount: sar(112.5),
    appliedCouponCode: "SAVE10",
    driverCollectedCash: sar(0),
    refundedAmount: sar(0),
    status: "confirmed",
    paymentStatus: "captured",
    preferredTimeSlot: "afternoon",
  });
  await db.insert(orderItems).values([
    {
      orderId: order3Id,
      productId: product2Id,
      quantity: 1,
      expectedEmptiesToReturn: 0,
      actualEmptiesReturned: 0,
      deliveredQuantity: 0,
      priceAtPurchase: sar(14),
      taxAtPurchase: sar(1.26),
      depositAtPurchase: sar(35),
    },
    {
      orderId: order3Id,
      productId: product4Id,
      quantity: 1,
      expectedEmptiesToReturn: 0,
      actualEmptiesReturned: 0,
      deliveredQuantity: 0,
      priceAtPurchase: sar(30),
      taxAtPurchase: sar(2.24),
      depositAtPurchase: sar(35),
    },
  ]);

  // --- Order 4: out_for_delivery ---
  const order4Id = randomUUID();
  await db.insert(orders).values({
    id: order4Id,
    idempotencyKey: randomUUID(),
    orderReference: orderRef(),
    userId: customer1Id,
    addressId: addr1Id,
    shippingAddressSnapshot: addressSnapshot1,
    driverId: driver1Id,
    currency: "SAR",
    subtotalAmount: sar(16),
    deliveryAmount: sar(5),
    depositAmount: sar(40),
    discountAmount: sar(0),
    taxAmount: sar(1.44),
    totalAmount: sar(62.44),
    driverCollectedCash: sar(0),
    refundedAmount: sar(0),
    status: "out_for_delivery",
    paymentStatus: "pending",
  });
  await db.insert(orderItems).values([
    {
      orderId: order4Id,
      productId: product1Id,
      quantity: 2,
      expectedEmptiesToReturn: 2,
      actualEmptiesReturned: 0,
      deliveredQuantity: 0,
      priceAtPurchase: sar(8),
      taxAtPurchase: sar(0.72),
      depositAtPurchase: sar(20),
    },
  ]);

  // --- Order 5: cancelled ---
  const order5Id = randomUUID();
  await db.insert(orders).values({
    id: order5Id,
    idempotencyKey: randomUUID(),
    orderReference: orderRef(),
    userId: customer2Id,
    addressId: addr2Id,
    shippingAddressSnapshot: addressSnapshot2,
    driverId: null,
    currency: "SAR",
    subtotalAmount: sar(14),
    deliveryAmount: sar(5),
    depositAmount: sar(35),
    discountAmount: sar(0),
    taxAmount: sar(1.26),
    totalAmount: sar(55.26),
    driverCollectedCash: sar(0),
    refundedAmount: sar(55.26),
    status: "cancelled",
    paymentStatus: "refunded",
    cancelReason: "Customer requested cancellation",
    cancelledAt: new Date(),
  });
  await db.insert(orderItems).values([
    {
      orderId: order5Id,
      productId: product2Id,
      quantity: 1,
      expectedEmptiesToReturn: 0,
      actualEmptiesReturned: 0,
      deliveredQuantity: 0,
      priceAtPurchase: sar(14),
      taxAtPurchase: sar(1.26),
      depositAtPurchase: sar(35),
    },
  ]);

  console.log("✅ Orders (5) + order items");

  // ──────────────────────────────────────────────
  // 9. PAYMENTS
  // ──────────────────────────────────────────────

  await db.insert(payments).values([
    {
      orderId: order1Id,
      amount: sar(82.25),
      method: "cash_on_delivery",
      status: "captured",
      providerReference: null,
    },
    {
      orderId: order3Id,
      amount: sar(112.5),
      method: "card",
      status: "captured",
      providerReference: "STRIPE-TEST-PI-001",
    },
    {
      orderId: order5Id,
      amount: sar(55.26),
      method: "wallet",
      status: "refunded",
      providerReference: "WALLET-REF-001",
    },
  ]);
  console.log("✅ Payments (3)");

  // ──────────────────────────────────────────────
  // 10. BOTTLE LEDGER
  // ──────────────────────────────────────────────

  await db.insert(bottleLedger).values([
    // Delivered 1 bottle to customer1 on order1
    {
      userId: customer1Id,
      orderId: order1Id,
      quantityChange: 1,
      depositValueApplied: sar(50),
      reason: "initial_deposit",
      notes: "First delivery of 19L dispenser",
    },
    // Customer returned 1 bottle on same order
    {
      userId: customer1Id,
      orderId: order1Id,
      quantityChange: -1,
      depositValueApplied: sar(50),
      reason: "delivery_return",
      notes: "Driver collected 1 empty bottle",
    },
  ]);
  console.log("✅ Bottle ledger entries (2)");

  // ──────────────────────────────────────────────
  // 11. USER PREFERENCES
  // ──────────────────────────────────────────────

  await db
    .insert(userPreferences)
    .values([
      {
        userId: customer1Id,
        defaultAddressId: addr1Id,
        smsNotifications: true,
        pushNotifications: true,
        preferredTimeSlot: "morning",
      },
      {
        userId: customer2Id,
        defaultAddressId: addr2Id,
        smsNotifications: false,
        pushNotifications: true,
        preferredTimeSlot: "evening",
      },
      {
        userId: customer3Id,
        defaultAddressId: addr3Id,
        smsNotifications: true,
        pushNotifications: false,
        preferredTimeSlot: "afternoon",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ User preferences (3)");

  // ──────────────────────────────────────────────
  // Done
  // ──────────────────────────────────────────────

  console.log("\n🎉 Seed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end();
  process.exit(1);
});
