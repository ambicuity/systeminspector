<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
const input = ref('')
const messages = ref([
  { role: 'ai', text: 'SystemInspector AI initialized. How can I help you query your hardware?' }
])

const toggleChat = () => {
  isOpen.value = !isOpen.value
}

const sendMessage = () => {
  if (!input.value.trim()) return
  
  const query = input.value.trim()
  messages.value.push({ role: 'user', text: query })
  input.value = ''
  
  setTimeout(() => {
    let response = ''
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.match(/^(hi|hello|hey|greetings)/)) {
      response = "Hello! I'm the SystemInspector AI. I can guide you to the right API methods for querying your hardware and OS."
    } else if (lowerQuery.includes('install')) {
      response = "To install SystemInspector, just run `npm install systeminspector --save`. Check out the Quick Start guide in the sidebar!"
    } else if (lowerQuery.includes('cpu') || lowerQuery.includes('processor')) {
      response = "For CPU details, use the `si.cpu()`, `si.cpuFlags()`, or `si.cpuTemperature()` functions."
    } else if (lowerQuery.includes('memory') || lowerQuery.includes('ram')) {
      response = "You can retrieve memory information using `si.mem()`. It returns total, free, active, and available RAM."
    } else {
      response = `For queries related to "${query}", I recommend checking the sidebar for the specific API reference, such as si.system() or si.osInfo().`
    }
    
    messages.value.push({ role: 'ai', text: response })
  }, 600)
}
</script>

<template>
  <div class="ai-chatbot-wrapper">
    <!-- Chat Window -->
    <div class="chat-window" :class="{ 'is-open': isOpen }">
      <div class="chat-header">
        <div class="ai-status">
          <span class="pulse-dot"></span>
          Inspector AI
        </div>
        <button class="close-btn" @click="toggleChat">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <div class="chat-body">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          {{ msg.text }}
        </div>
      </div>
      
      <div class="chat-footer">
        <input 
          v-model="input" 
          @keyup.enter="sendMessage" 
          type="text" 
          placeholder="Ask a question..."
        />
        <button @click="sendMessage" class="send-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>

    <!-- Floating Toggle Button -->
    <button class="floating-btn" @click="toggleChat" :class="{ 'is-hidden': isOpen }">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      <span class="tooltip">Ask AI</span>
    </button>
  </div>
</template>

<style scoped>
.ai-chatbot-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  font-family: var(--vp-font-family-base);
}

.floating-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  color: white;
  border: none;
  box-shadow: 0 8px 24px rgba(0, 229, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
}

.floating-btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 32px rgba(138, 43, 226, 0.6);
}

.floating-btn.is-hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
}

.tooltip {
  position: absolute;
  right: 70px;
  background-color: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 0.2s;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.floating-btn:hover .tooltip {
  opacity: 1;
}

/* Chat Window */
.chat-window {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 350px;
  height: 500px;
  max-height: calc(100vh - 40px);
  background-color: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transform: translateY(20px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

.chat-window.is-open {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0) scale(1);
}

.chat-header {
  padding: 16px;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #00e5ff;
  border-radius: 50%;
  box-shadow: 0 0 8px #00e5ff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(0, 229, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); }
}

.close-btn {
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}
.close-btn:hover { background-color: var(--vp-c-bg); color: var(--vp-c-text-1); }

.chat-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.message.ai {
  align-self: flex-start;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-bottom-left-radius: 2px;
  border: 1px solid var(--vp-c-border);
}

.message.user {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  color: white;
  border-bottom-right-radius: 2px;
}

.chat-footer {
  padding: 16px;
  background-color: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  gap: 8px;
}

.chat-footer input {
  flex: 1;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-1);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
}
.chat-footer input:focus { border-color: var(--vp-c-brand-1); }

.send-btn {
  background-color: var(--vp-c-brand-2);
  color: white;
  border: none;
  border-radius: 8px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.send-btn:hover { background-color: var(--vp-c-brand-1); }

@media (max-width: 640px) {
  .chat-window { width: 300px; height: 400px; }
}
</style>
