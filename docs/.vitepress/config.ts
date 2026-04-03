import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'QA Utils',
  description: 'A comprehensive collection of quality assurance tools and utilities',
  base: '/qa-utils/docs/',
  head: [
    ['link', { rel: 'icon', href: '/qa-utils/docs/favicon.ico' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
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
          { text: 'Live Demo', link: 'https://kobenguyent.github.io/qa-utils/#/' },
          { text: 'GitHub', link: 'https://github.com/kobenguyent/qa-utils' },
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
      { icon: 'github', link: 'https://github.com/kobenguyent/qa-utils' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present KobeT',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/kobenguyent/qa-utils/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
