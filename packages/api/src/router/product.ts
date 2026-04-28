import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { eq } from "@water/db";
import { insertProductSchema, products } from "@water/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const productRouter = createTRPCRouter({
    /** Returns all active products sorted by sortOrder */
    getProducts: publicProcedure.query(async ({ ctx }) => {
        return await ctx.db
            .select()
            .from(products)
            .where(eq(products.isActive, true))
            .orderBy(products.sortOrder);
    }),

    getProductById: publicProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const [product] = await ctx.db
                .select()
                .from(products)
                .where(eq(products.id, input.id))
                .limit(1);

            if (!product) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
            }
            return product;
        }),

    /** [Admin] Returns ALL products including inactive ones */
    adminGetAllProducts: protectedProcedure.query(async ({ ctx }) => {
        // Note: You might want to add a role check here later (e.g., ctx.session.user.role === 'admin')
        return await ctx.db
            .select()
            .from(products)
            .orderBy(products.sortOrder);
    }),

    /** [Admin] Creates a new product */
    createProduct: protectedProcedure
        .input(insertProductSchema.omit({ id: true, createdAt: true, updatedAt: true }))
        .mutation(async ({ ctx, input }) => {
            const [newProduct] = await ctx.db
                .insert(products)
                .values(input)
                .returning();
            return newProduct;
        }),

    /** [Admin] Updates an existing product */
    updateProduct: protectedProcedure
        .input(
            insertProductSchema.partial().extend({
                id: z.string().uuid(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const [updatedProduct] = await ctx.db
                .update(products)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(products.id, id))
                .returning();

            if (!updatedProduct) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Could not find product to update",
                });
            }
            return updatedProduct;
        }),

    /** [Admin] Soft-deletes a product by setting isActive = false */
    deactivateProduct: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const [product] = await ctx.db
                .update(products)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(products.id, input.id))
                .returning();
            return product;
        }),

    /** [Admin] Restores a previously deactivated product */
    reactivateProduct: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const [product] = await ctx.db
                .update(products)
                .set({ isActive: true, updatedAt: new Date() })
                .where(eq(products.id, input.id))
                .returning();
            return product;
        }),
});