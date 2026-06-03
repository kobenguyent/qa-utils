import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'KobeanQAUtils',
  description: 'A comprehensive collection of quality assurance tools and utilities',
  base: '/kobeanqautils/docs/',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/kobeanqautils/docs/logo-icon.png' }],
  ],
  themeConfig: {
    logo: {
      light: '/logo-icon.png',
      dark: '/logo-icon-dark-nebula.png',
      alt: 'KobeanQAUtils',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'CLI', link: '/guide/cli' },
      {
        text: 'Tools',
        items: [
          { text: 'Overview', link: '/tools/' },
          { text: 'Utility Tools', link: '/tools/utility-tools' },
          { text: 'Testing Tools', link: '/tools/testing-tools' },
          { text: 'AI-Powered Tools', link: '/tools/ai-tools' },
        ],
      },
      { text: 'MCP Server', link: '/mcp-server' },
      { text: 'Agent Mode', link: '/agent-mode' },
      {
        text: 'Links',
        items: [
          { text: 'Live Demo', link: 'https://kobenguyent.github.io/kobeanqautils/#/' },
          { text: 'API Docs', link: 'https://kobenguyent.github.io/kobeanqautils/api-docs/' },
          { text: 'GitHub', link: 'https://github.com/kobenguyent/kobeanqautils' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Desktop App', link: '/guide/desktop-app' },
            { text: 'CLI (kobeanqautils-cli)', link: '/guide/cli' },
          ],
        },
        {
          text: 'Architecture',
          items: [
            { text: 'Project Structure', link: '/guide/project-structure' },
            { text: 'Shared Tools', link: '/guide/shared-tools' },
          ],
        },
      ],
      '/tools/': [
        {
          text: 'Tools',
          items: [
            { text: 'Overview', link: '/tools/' },
            { text: 'Utility Tools', link: '/tools/utility-tools' },
            { text: 'Testing Tools', link: '/tools/testing-tools' },
            { text: 'AI-Powered Tools', link: '/tools/ai-tools' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kobenguyent/kobeanqautils' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present KobeT',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/kobenguyent/kobeanqautils/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
