import type { Models } from "react-native-appwrite";
import { ExecutionMethod } from "react-native-appwrite";
import { FUNCTION_IDS, functions } from "./appwrite";

type ExecuteOptions = {
  method?: ExecutionMethod;
  path?: string;
  asyncExecution?: boolean;
};

const parseResponseBody = <T>(responseBody?: string): T | null => {
  if (!responseBody) return null;

  try {
    return JSON.parse(responseBody) as T;
  } catch {
    return null;
  }
};

export const executeFunction = async <T = unknown>(
  functionId: string,
  payload?: unknown,
  options: ExecuteOptions = {},
): Promise<{ execution: Models.Execution; data: T | null }> => {
  const execution = await functions.createExecution(
    functionId,
    payload ? JSON.stringify(payload) : undefined,
    options.asyncExecution ?? false,
    options.path ?? "/",
    options.method ?? ExecutionMethod.POST,
    payload ? { "Content-Type": "application/json" } : undefined,
  );

  return {
    execution,
    data: parseResponseBody<T>(execution.responseBody),
  };
};

export const runMonthlyReportGenerator = () =>
  executeFunction(
    FUNCTION_IDS.MONTHLY_REPORT_GENERATOR,
    {},
    {
      method: ExecutionMethod.POST,
    },
  );

export const runAnalyticsCalculator = (businessId?: string) =>
  executeFunction(
    FUNCTION_IDS.ANALYTICS_CALCULATOR,
    businessId ? { businessId } : {},
    {
      method: ExecutionMethod.POST,
    },
  );

export const runBackupCreator = (businessId: string, userId: string) =>
  executeFunction(
    FUNCTION_IDS.BACKUP_CREATOR,
    { businessId, userId },
    {
      method: ExecutionMethod.POST,
    },
  );

export const runSubscriptionValidator = (input: {
  userId: string;
  businessId: string;
  platform: "ios" | "android" | "web";
  productId: string;
  receipt: string;
}) =>
  executeFunction(FUNCTION_IDS.SUBSCRIPTION_VALIDATOR, input, {
    method: ExecutionMethod.POST,
  });

export const runCleanupOldData = () =>
  executeFunction(
    FUNCTION_IDS.CLEANUP_OLD_DATA,
    {},
    {
      method: ExecutionMethod.POST,
    },
  );

export const runAIAssistant = (input: {
  businessId: string;
  prompt: string;
  mode?: "insights" | "qa" | "draft";
}) =>
  executeFunction<{ ok: boolean; answer?: string; error?: string }>(
    FUNCTION_IDS.AI_ASSISTANT,
    input,
    {
      method: ExecutionMethod.POST,
    },
  );

export const createPublicPaymentLink = (input: {
  invoiceId: string;
  businessId: string;
  expiresInMinutes?: number;
}) =>
  executeFunction<{
    ok: boolean;
    link?: string;
    token?: string;
    error?: string;
  }>(FUNCTION_IDS.PAYMENTS_ORCHESTRATOR, input, {
    method: ExecutionMethod.POST,
    path: "/create-link",
  });

export const getPublicInvoiceByToken = (token: string) =>
  executeFunction<{
    ok: boolean;
    invoice?: any;
    business?: any;
    error?: string;
  }>(FUNCTION_IDS.PAYMENTS_ORCHESTRATOR, undefined, {
    method: ExecutionMethod.GET,
    path: `/invoice?token=${encodeURIComponent(token)}`,
  });

export const verifyPaymentWebhook = (input: {
  provider: "razorpay" | "phonepe" | "paytm";
  payload: Record<string, any>;
  signature?: string;
}) =>
  executeFunction<{
    ok: boolean;
    verified?: boolean;
    invoiceId?: string;
    error?: string;
  }>(FUNCTION_IDS.PAYMENTS_ORCHESTRATOR, input, {
    method: ExecutionMethod.POST,
    path: "/verify-webhook",
  });

export const generateInvoicePdf = (input: {
  invoiceId: string;
  businessId: string;
  paymentLink?: string;
}) =>
  executeFunction<{ ok: boolean; fileId?: string; error?: string }>(
    FUNCTION_IDS.INVOICE_PDF_GENERATOR,
    input,
    {
      method: ExecutionMethod.POST,
    },
  );

export const runReminderAutomation = (input?: {
  businessId?: string;
  channels?: Array<"in_app" | "email" | "sms">;
}) =>
  executeFunction<{ ok: boolean; remindersCreated?: number; error?: string }>(
    FUNCTION_IDS.REMINDER_AUTOMATION,
    input ?? {},
    {
      method: ExecutionMethod.POST,
    },
  );
