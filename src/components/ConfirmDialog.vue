<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { answerConfirm, pendingConfirm } from "../lib/confirmDialog.ts";
import { t } from "../i18n/index.ts";

const cancelButton = ref<HTMLButtonElement | null>(null);

// Cancel is focused first: the safe answer for destructive questions.
watch(pendingConfirm, async (value) => {
  if (!value) return;
  await nextTick();
  cancelButton.value?.focus();
});
</script>

<template>
  <div
    v-if="pendingConfirm"
    class="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
    data-testid="confirm-backdrop"
    @click.self="answerConfirm(false)"
    @keydown.esc="answerConfirm(false)"
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-message"
      data-testid="confirm-dialog"
      class="card w-full max-w-md p-6"
    >
      <p
        id="confirm-message"
        data-testid="confirm-message"
        class="whitespace-pre-line text-sm text-slate-800"
      >
        {{ pendingConfirm.message }}
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button
          ref="cancelButton"
          data-testid="confirm-cancel"
          class="btn btn-danger"
          @click="answerConfirm(false)"
        >
          {{ t("common.cancel") }}
        </button>
        <button data-testid="confirm-ok" class="btn btn-secondary" @click="answerConfirm(true)">
          {{ t("confirm.ok") }}
        </button>
      </div>
    </div>
  </div>
</template>
