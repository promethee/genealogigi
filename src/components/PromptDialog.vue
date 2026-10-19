<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { MAX_FAMILY_NAME } from "../data/familyName.ts";
import { t } from "../i18n/index.ts";
import { answerPrompt, pendingPrompt } from "../lib/promptDialog.ts";

const text = ref("");
const input = ref<HTMLInputElement | null>(null);

watch(pendingPrompt, async (value) => {
  if (!value) return;
  text.value = value.initial ?? "";
  await nextTick();
  input.value?.focus();
  input.value?.select();
});

function submit(): void {
  if (text.value.trim() !== "") answerPrompt(text.value);
}
</script>

<template>
  <div
    v-if="pendingPrompt"
    class="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
    data-testid="prompt-backdrop"
    @click.self="answerPrompt(null)"
    @keydown.esc="answerPrompt(null)"
  >
    <form
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-message"
      data-testid="prompt-dialog"
      class="card w-full max-w-md p-6"
      @submit.prevent="submit"
    >
      <label id="prompt-message" for="prompt-input" class="text-sm font-medium text-slate-800">
        {{ pendingPrompt.message }}
      </label>
      <input
        id="prompt-input"
        ref="input"
        v-model="text"
        data-testid="prompt-input"
        class="input mt-3 w-full"
        :placeholder="pendingPrompt.placeholder"
        :maxlength="MAX_FAMILY_NAME"
        autocomplete="off"
      />
      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          data-testid="prompt-cancel"
          class="btn btn-secondary"
          @click="answerPrompt(null)"
        >
          {{ t("common.cancel") }}
        </button>
        <button
          type="submit"
          data-testid="prompt-ok"
          class="btn btn-primary"
          :disabled="text.trim() === ''"
        >
          {{ t("prompt.ok") }}
        </button>
      </div>
    </form>
  </div>
</template>
