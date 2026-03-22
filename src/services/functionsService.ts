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
