<template>
  <Transition
    enter-active-class="transition duration-100 ease-out"
    enter-from-class="transform translate-y-2 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-75 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-2 opacity-0"
  >
    <div
      v-if="show"
      class="fixed bottom-5 right-5 z-50 border-2 border-ink bg-ink text-paper px-4 py-2.5 font-mono text-xs shadow-raw flex items-center gap-3"
    >
      <span class="text-editorial-red font-bold">§</span>
      <span>{{ text }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  text: string;
}>();
</script>
