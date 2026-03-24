import { runAIAssistant } from "./functionsService";

export const askInvoiceFlowAI = async (input: {
  businessId: string;
  prompt: string;
  mode?: "insights" | "qa" | "draft";
}) => {
  const { data } = await runAIAssistant(input);

  if (!data?.ok || !data.answer) {
    throw new Error(
      data?.error || "AI assistant could not generate a response.",
    );
  }

  return data.answer;
};
