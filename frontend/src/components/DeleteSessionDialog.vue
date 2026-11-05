<script setup lang="ts">
import { useTemplateRef } from 'vue'

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function open(): void {
  dialog.value?.showModal()
}

function confirmDeletion(): void {
  dialog.value?.close()
  emit('confirm')
}

function cancelDeletion(): void {
  dialog.value?.close()
  emit('cancel')
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" aria-label="Delete session" @cancel="emit('cancel')">
    <h2>Delete session?</h2>
    <p>This practice session will be removed.</p>

    <button type="button" autofocus @click="cancelDeletion">Cancel</button>

    <button type="button" data-test="confirm-delete" @click="confirmDeletion">
      Delete session
    </button>
  </dialog>
</template>

<style scoped>
dialog {
  max-width: 400px;
  padding: 24px;
  border: 0;
  border-radius: 12px;
}

dialog::backdrop {
  background: rgb(0 0 0 / 45%);
}
</style>
