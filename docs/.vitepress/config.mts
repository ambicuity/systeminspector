import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "systeminspector",
  description: "Lightweight collection of 58 core inspection functions to retrieve detailed hardware, system and OS information.",
  sitemap: {
    hostname: 'https://systeminspector.riteshrana.engineer'
  },
  head: [
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { property: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { property: 'twitter:image', content: '/og-image.png' }],
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      "name": "SystemInspector",
      "description": "Lightweight collection of 58 core inspection functions to retrieve detailed hardware, system and OS information.",
      "programmingLanguage": "TypeScript",
      "codeRepository": "https://github.com/ambicuity/systeminspector",
      "license": "https://opensource.org/licenses/MIT"
    })]
  ],
  themeConfig: {
    logo: '/systeminspector.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/gettingstarted' },
      { text: 'Changelog', link: 'https://github.com/ambicuity/systeminspector/blob/main/CHANGELOG.md' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/gettingstarted' },
          { text: 'General', link: '/general' },
          { text: 'System', link: '/system' },
          { text: 'OS', link: '/os' }
        ]
      },
      {
        text: 'Hardware',
        items: [
          { text: 'CPU', link: '/cpu' },
          { text: 'Memory', link: '/memory' },
          { text: 'Battery', link: '/battery' },
          { text: 'Graphics', link: '/graphics' },
          { text: 'Audio', link: '/audio' },
          { text: 'Bluetooth', link: '/bluetooth' },
          { text: 'Printer', link: '/printer' },
          { text: 'USB', link: '/usb' }
        ]
      },
      {
        text: 'Software & Other',
        items: [
          { text: 'Processes', link: '/processes' },
          { text: 'Filesystem', link: '/filesystem' },
          { text: 'Network', link: '/network' },
          { text: 'Wifi', link: '/wifi' },
          { text: 'Docker', link: '/docker' },
          { text: 'VirtualBox', link: '/vbox' },
          { text: 'Stats Functions', link: '/statsfunctions' },
          { text: 'Testing', link: '/tests' },
          { text: 'Known Issues', link: '/issues' },
          { text: 'FAQ & Troubleshooting', link: '/faq' },
          { text: 'Trademarks', link: '/trademarks' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ambicuity/systeminspector' }
    ],
    
    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License. <a href="https://buymeacoffee.com/ritesh.rana" target="_blank">☕ Buy Me a Coffee</a>',
      copyright: 'Copyright © 2026 Ritesh Rana'
    }
  }
})
