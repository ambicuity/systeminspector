<script setup lang="ts">
import { ref, onMounted } from 'vue'

const downloads = ref<string | null>(null)
const error = ref(false)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('https://api.npmjs.org/downloads/point/last-year/%40ambicuity%2Fsysteminspector')
    const data = await res.json()
    if (data && data.downloads) {
      // Format number to '12.5M' or '840K' style
      const num = data.downloads
      if (num >= 100000000) {
        downloads.value = Math.floor(num / 1000000) + 'M+'
      } else if (num >= 1000000) {
        downloads.value = (num / 1000000).toFixed(1) + 'M'
      } else if (num >= 1000) {
        downloads.value = (num / 1000).toFixed(0) + 'K'
      } else {
        downloads.value = num.toString()
      }
    } else {
      error.value = true
    }
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="npm-stats-container">
    <div class="stat-card">
      <div class="stat-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/>
          <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/>
          <path d="M4 12h16"/>
          <path d="M12 8v8"/>
        </svg>
      </div>
      <div class="stat-details">
        <span class="stat-label">NPM Downloads (Last Year)</span>
        <span v-if="loading" class="stat-value skeleton"></span>
        <span v-else-if="error" class="stat-value error">Unavailable</span>
        <span v-else class="stat-value">{{ downloads }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.npm-stats-container {
  display: flex;
  justify-content: center;
  margin: 2rem 0 3rem 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background-color: var(--vp-c-bg-soft);
  backdrop-filter: blur(12px);
  border: 1px solid var(--vp-c-border);
  padding: 1.5rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(0, 229, 255, 0.1);
  border-radius: 12px;
  color: var(--vp-c-brand-1);
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1.2;
}

.skeleton {
  width: 100px;
  height: 2.4rem;
  background: linear-gradient(90deg, var(--vp-c-bg-soft) 25%, var(--vp-c-border) 50%, var(--vp-c-bg-soft) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.error {
  font-size: 1.5rem;
  color: #ff5555;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
