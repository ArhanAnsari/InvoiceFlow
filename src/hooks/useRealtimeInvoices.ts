import { useEffect } from "react";
import { subscribeToInvoices } from "../services/realtimeService";

type InvoiceListener = (invoice: any) => void;

export const useRealtimeInvoices = (
  businessId: string | undefined,
  onUpdate: InvoiceListener,
) => {
  useEffect(() => {
    if (!businessId) return;

    const unsubscribe = subscribeToInvoices(businessId, onUpdate);
    return () => unsubscribe();
  }, [businessId, onUpdate]);
};
