import { getPaymentHistory, getPaymentHistoryCount, getAllPremiumSubscriptions } from "./db";

/**
 * Convert data array to CSV format
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: (keyof T)[]
): string {
  if (data.length === 0) {
    return "";
  }

  const keys = headers || (Object.keys(data[0]) as (keyof T)[]);
  
  // Create header row
  const headerRow = keys.map(key => `"${String(key).replace(/"/g, '""')}"`).join(",");
  
  // Create data rows
  const dataRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) {
        return '""';
      }
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Export payment history to CSV
 */
export async function exportPaymentHistoryToCSV(filters?: {
  userId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: string;
  maxAmount?: string;
  paymentMethod?: string;
}): Promise<string> {
  try {
    // Get total count
    const count = await getPaymentHistoryCount(filters);
    
    // Fetch all records in batches
    const allPayments = [];
    const batchSize = 100;
    
    for (let offset = 0; offset < count; offset += batchSize) {
      const batch = await getPaymentHistory({
        ...filters,
        limit: batchSize,
        offset,
      });
      allPayments.push(...batch);
    }

    // Format data for CSV
    const formattedData = allPayments.map(payment => ({
      "ID": payment.id,
      "Utilisateur ID": payment.userId,
      "Montant": payment.amount,
      "Devise": payment.currency,
      "Statut": payment.status,
      "Méthode de Paiement": payment.paymentMethod,
      "ID Transaction": payment.transactionId || "-",
      "Référence Commande": payment.referenceCommand || "-",
      "Nombre de Tentatives": payment.retryCount,
      "Créé": new Date(payment.createdAt).toLocaleString("fr-FR"),
      "Complété": payment.completedAt ? new Date(payment.completedAt).toLocaleString("fr-FR") : "-",
    }));

    return convertToCSV(formattedData);
  } catch (error) {
    console.error("[CSV Export] Failed to export payment history:", error);
    throw error;
  }
}

/**
 * Export subscriptions to CSV
 */
export async function exportSubscriptionsToCSV(filters?: {
  status?: "active" | "expired" | "cancelled";
  startDate?: Date;
  endDate?: Date;
}): Promise<string> {
  try {
    // Get all subscriptions and filter manually
    const allSubscriptions = await getAllPremiumSubscriptions();
    let subscriptions = allSubscriptions;
    
    if (filters?.status) {
      subscriptions = subscriptions.filter((sub: any) => sub.status === filters.status);
    }
    
    if (filters?.startDate) {
      subscriptions = subscriptions.filter((sub: any) => new Date(sub.startDate) >= filters.startDate!);
    }
    
    if (filters?.endDate) {
      subscriptions = subscriptions.filter((sub: any) => new Date(sub.endDate) <= filters.endDate!);
    }

    // Format data for CSV
    const formattedData = subscriptions.map((sub: any) => ({
      "ID": sub.id,
      "Utilisateur ID": sub.userId,
      "Montant": sub.amount,
      "Devise": sub.currency,
      "Statut": sub.status,
      "Raison Annulation": sub.cancellationReason || "-",
      "Début": new Date(sub.startDate).toLocaleString("fr-FR"),
      "Fin": new Date(sub.endDate).toLocaleString("fr-FR"),
      "Créé": new Date(sub.createdAt).toLocaleString("fr-FR"),
      "Mis à Jour": new Date(sub.updatedAt).toLocaleString("fr-FR"),
    }));

    return convertToCSV(formattedData);
  } catch (error) {
    console.error("[CSV Export] Failed to export subscriptions:", error);
    throw error;
  }
}

/**
 * Generate CSV file name with timestamp
 */
export function generateCSVFileName(type: "payments" | "subscriptions"): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `digilearn-${type}-${timestamp}.csv`;
}
