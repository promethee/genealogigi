import { ref } from "vue";

/** The question currently shown by the in-app confirmation dialog, or null. */
export const pendingConfirm = ref<{
  message: string;
  safe: boolean;
  resolve: (ok: boolean) => void;
} | null>(null);

/** Shows the dialog; resolves true on Confirm, false on anything else. */
export function askConfirm(message: string, options: { tone?: "safe" } = {}): Promise<boolean> {
  pendingConfirm.value?.resolve(false);
  return new Promise<boolean>((resolve) => {
    pendingConfirm.value = { message, safe: options.tone === "safe", resolve };
  });
}

export function answerConfirm(ok: boolean): void {
  const current = pendingConfirm.value;
  pendingConfirm.value = null;
  current?.resolve(ok);
}
