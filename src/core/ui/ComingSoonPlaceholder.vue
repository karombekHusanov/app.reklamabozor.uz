<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="coming-soon flex flex-col items-center justify-center px-6 py-16 text-center">
    <div
      class="coming-soon__art"
      aria-hidden="true"
    >
      <svg
        class="coming-soon__svg"
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- soft ground glow -->
        <ellipse
          cx="100"
          cy="138"
          rx="58"
          ry="10"
          class="coming-soon__glow"
        />

        <!-- desk / platform -->
        <rect
          x="42"
          y="108"
          width="116"
          height="14"
          rx="7"
          class="coming-soon__desk"
        />

        <!-- main card -->
        <rect
          x="58"
          y="42"
          width="84"
          height="68"
          rx="16"
          class="coming-soon__card"
        />
        <rect
          x="70"
          y="56"
          width="40"
          height="8"
          rx="4"
          class="coming-soon__line"
        />
        <rect
          x="70"
          y="72"
          width="60"
          height="6"
          rx="3"
          class="coming-soon__line coming-soon__line--soft"
        />
        <rect
          x="70"
          y="86"
          width="48"
          height="6"
          rx="3"
          class="coming-soon__line coming-soon__line--soft"
        />

        <!-- clock badge -->
        <circle
          cx="142"
          cy="48"
          r="22"
          class="coming-soon__clock-bg"
        />
        <circle
          cx="142"
          cy="48"
          r="16"
          class="coming-soon__clock-face"
        />
        <circle
          cx="142"
          cy="48"
          r="2.5"
          class="coming-soon__clock-hand"
        />
        <path
          d="M142 40.5V48L147.5 51.5"
          class="coming-soon__clock-hand"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- sparkles -->
        <path
          d="M38 58l2.2 5.4L46 66l-5.4 2.2L38 74l-2.2-5.8L30 66l5.8-2.6L38 58Z"
          class="coming-soon__spark"
        />
        <path
          d="M168 86l1.6 3.8L174 92l-4.4 1.6L168 98l-1.6-4.4L162 92l4.4-2.2L168 86Z"
          class="coming-soon__spark coming-soon__spark--dim"
        />
      </svg>
    </div>

    <p class="rb-font-display mt-6 text-xl font-extrabold tracking-[-0.02em] text-foreground">
      {{ title }}
    </p>
  </div>
</template>

<style scoped>
.coming-soon__svg {
  width: 11.5rem;
  height: auto;
  display: block;
}

.coming-soon__glow {
  fill: color-mix(in oklab, var(--primary) 18%, transparent);
}

.coming-soon__desk {
  fill: color-mix(in oklab, var(--muted-foreground) 14%, var(--card));
}

.coming-soon__card {
  fill: color-mix(in oklab, var(--card) 92%, var(--primary) 8%);
  stroke: color-mix(in oklab, var(--primary) 22%, var(--border));
  stroke-width: 1.5;
}

.coming-soon__line {
  fill: color-mix(in oklab, var(--primary) 45%, transparent);
}

.coming-soon__line--soft {
  fill: color-mix(in oklab, var(--muted-foreground) 28%, transparent);
}

.coming-soon__clock-bg {
  fill: color-mix(in oklab, var(--primary) 16%, var(--card));
  stroke: color-mix(in oklab, var(--primary) 28%, transparent);
  stroke-width: 1.5;
}

.coming-soon__clock-face {
  fill: var(--card);
  stroke: color-mix(in oklab, var(--primary) 35%, transparent);
  stroke-width: 1.5;
}

.coming-soon__clock-hand {
  fill: var(--primary);
  stroke: var(--primary);
}

.coming-soon__spark {
  fill: color-mix(in oklab, var(--primary) 70%, transparent);
}

.coming-soon__spark--dim {
  opacity: 0.65;
}
</style>
