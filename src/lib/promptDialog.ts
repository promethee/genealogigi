import { ref } from "vue";

export interface PromptOptions {
  message: string;
  initial?: string;
  placeholder?: string;
}

/** The question currently shown by the in-app text prompt, or null. */
export const pendingPrompt = ref<
  (PromptOptions & { resolve: (value: string | null) => void }) | null
>(null);

/** Shows the prompt; resolves with the typed text, or null when cancelled. */
export function askText(options: PromptOptions): Promise<string | null> {
  pendingPrompt.value?.resolve(null);
  return new Promise<string | null>((resolve) => {
    pendingPrompt.value = { ...options, resolve };
  });
}

export function answerPrompt(value: string | null): void {
  const current = pendingPrompt.value;
  pendingPrompt.value = null;
  current?.resolve(value);
}
