import { create } from "zustand";
import {
    COLLECTIONS,
    databases,
    DB_ID,
    ID,
    Permission,
    Query,
    Role,
} from "../services/appwrite";
import db from "../services/database";
import { Business, PlanType } from "../types";

interface BusinessState {
  businesses: Business[];
  currentBusiness: Business | null;
  isLoading: boolean;
  /** True once the first fetchBusinesses call has completed (success or failure). */
  initialized: boolean;
  fetchBusinesses: (userId: string) => Promise<void>;
  switchBusiness: (businessId: string) => void;
  createBusiness: (input: {
    userId: string;
    name: string;
    gstin?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency?: string;
    taxType?: "gst" | "vat" | "none";
    invoicePrefix?: string;
  }) => Promise<void>;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  businesses: [],
  currentBusiness: null,
  isLoading: false,
  initialized: false,

  fetchBusinesses: async (userId: string) => {
    set({ isLoading: true, businesses: [], currentBusiness: null });
    try {
      // Fetch from Appwrite
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.BUSINESSES,
        [Query.equal("ownerId", userId)],
      );

      const businesses = response.documents as unknown as Business[];
      set({
        businesses,
        currentBusiness: businesses.length > 0 ? businesses[0] : null,
      });

      // Also sync to local DB (simplified)
      for (const b of businesses) {
        await db.runAsync(
          `INSERT OR REPLACE INTO businesses ("$id", ownerId, name, gstin, address, logoFileId, planType, "$createdAt", "$updatedAt")
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.$id,
            b.ownerId,
            b.name,
            b.gstin ?? null,
            b.address ?? null,
            b.logoFileId ?? null,
            b.planType,
            b.$createdAt,
            b.$updatedAt,
          ],
        );
      }
    } catch (error) {
      console.error("Failed to fetch businesses", error);
      // Fallback to local DB
      const localBusinesses = await db.getAllAsync(
        "SELECT * FROM businesses WHERE ownerId = ?",
        [userId],
      );
      set({
        businesses: localBusinesses as Business[],
        currentBusiness:
          localBusinesses.length > 0 ? (localBusinesses[0] as Business) : null,
      });
    } finally {
      set({ isLoading: false, initialized: true });
    }
  },

  switchBusiness: (businessId: string) => {
    const { businesses } = get();
    const selected = businesses.find((b) => b.$id === businessId) || null;
    set({ currentBusiness: selected });
  },

  createBusiness: async (input) => {
    set({ isLoading: true });
    try {
      const currency = input.currency || "INR";
      const currencySymbol =
        currency === "USD"
          ? "$"
          : currency === "EUR"
            ? "EUR"
            : currency === "GBP"
              ? "GBP"
              : "Rs";

      const newBusiness = {
        ownerId: input.userId,
        name: input.name,
        gstin: input.gstin || undefined,
        address: input.address || undefined,
        phone: input.phone || undefined,
        email: input.email || undefined,
        planType: PlanType.FREE,
        currency,
        currencySymbol,
        invoicePrefix: input.invoicePrefix || "INV",
        invoiceCounter: 0,
        taxType: input.taxType || "gst",
        isActive: true,
        logoFileId: undefined,
        signatureFileId: undefined,
      };

      const response = await databases.createDocument(
        DB_ID,
        COLLECTIONS.BUSINESSES,
        ID.unique(),
        newBusiness,
        [
          Permission.read(Role.user(input.userId)),
          Permission.update(Role.user(input.userId)),
          Permission.delete(Role.user(input.userId)),
        ],
      );

      const createdBusiness = response as unknown as Business;

      // Update local state
      const { businesses } = get();
      set({
        businesses: [...businesses, createdBusiness],
        currentBusiness: createdBusiness,
      });

      // Save to local DB
      await db.runAsync(
        `INSERT OR REPLACE INTO businesses ("$id", ownerId, name, gstin, address, logoFileId, planType, "$createdAt", "$updatedAt")
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createdBusiness.$id,
          createdBusiness.ownerId,
          createdBusiness.name,
          createdBusiness.gstin || null,
          createdBusiness.address || null,
          createdBusiness.logoFileId || null,
          createdBusiness.planType,
          createdBusiness.$createdAt,
          createdBusiness.$updatedAt,
        ],
      );
    } catch (error) {
      console.error("Create business failed", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
