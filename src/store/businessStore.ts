import { create } from "zustand";
import { COLLECTIONS, databases, DB_ID, ID, Query } from "../services/appwrite";
import db from "../services/database";
import { Business, PlanType } from "../types";

interface BusinessState {
  businesses: Business[];
  currentBusiness: Business | null;
  isLoading: boolean;
  fetchBusinesses: (userId: string) => Promise<void>;
  switchBusiness: (businessId: string) => void;
  createBusiness: (
    userId: string,
    name: string,
    gstin?: string,
    address?: string,
  ) => Promise<void>;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  businesses: [],
  currentBusiness: null,
  isLoading: false,

  fetchBusinesses: async (userId: string) => {
    set({ isLoading: true });
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
          `INSERT OR REPLACE INTO businesses ($id, ownerId, name, gstin, address, logoFileId, planType, $createdAt, $updatedAt)
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
      set({ isLoading: false });
    }
  },

  switchBusiness: (businessId: string) => {
    const { businesses } = get();
    const selected = businesses.find((b) => b.$id === businessId) || null;
    set({ currentBusiness: selected });
  },

  createBusiness: async (
    userId: string,
    name: string,
    gstin?: string,
    address?: string,
  ) => {
    set({ isLoading: true });
    try {
      const newBusiness = {
        ownerId: userId,
        name,
        gstin,
        address,
        planType: PlanType.FREE,
        logoFileId: null,
      };

      const response = await databases.createDocument(
        DB_ID,
        COLLECTIONS.BUSINESSES,
        ID.unique(),
        newBusiness,
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
        `INSERT OR REPLACE INTO businesses ($id, ownerId, name, gstin, address, logoFileId, planType, $createdAt, $updatedAt)
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
