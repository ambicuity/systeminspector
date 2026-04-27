---
layout: home

hero:
  name: "SystemInspector"
  text: "Core Insights. Absolute Control."
  tagline: "The definitive Node.js engine for retrieving high-fidelity hardware, OS, and system telemetry across 8 operating systems. Zero dependencies. Pure execution."
  image:
    src: /systeminspector.png
    alt: SystemInspector Logo
  actions:
    - theme: brand
      text: Initialize System
      link: /gettingstarted
    - theme: alt
      text: "Access Source (GitHub)"
      link: https://github.com/ambicuity/systeminspector

features:
  - title: "Zero Dependencies. Native OS Execution."
    details: "Engineered for absolute security. No massive `node_modules` trees, no third-party vulnerabilities. Just lightweight, native-level telemetry."
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>'
  - title: "Omni-Platform Deployment."
    details: "Flawless execution across Linux, macOS, Windows, FreeBSD, OpenBSD, NetBSD, SunOS, and Android. One API, every environment."
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
  - title: "Strictly Typed & V8 Optimized."
    details: "First-class TypeScript schemas and asynchronous Promise architecture built for maximum V8 engine throughput and zero main-thread blocking."
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
---

<style>
.VPHero .name {
  background: linear-gradient(135deg, #00e5ff 0%, #8a2be2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  display: inline-block;
}
.VPHero .text {
  font-weight: 700;
  letter-spacing: -0.04em;
}
@keyframes hero-breathe {
  0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(1.5); }
  50% { opacity: 0.25; transform: translate(-50%, -50%) scale(1.6); }
}
.VPHero .image-bg {
  opacity: 0.15;
  background: linear-gradient(to right, #00e5ff, #8a2be2);
  filter: blur(120px);
  transform: translate(-50%, -50%) scale(1.5);
}
@media (prefers-reduced-motion: no-preference) {
  .VPHero .image-bg {
    animation: hero-breathe 8s ease-in-out infinite;
  }
}
</style>
