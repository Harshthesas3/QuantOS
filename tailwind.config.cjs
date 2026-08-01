module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B0C10',
          secondary: '#111318',
          tertiary: '#1F2229',
          hover: '#2A2E36',
        },
        accent: {
          primary: '#C8BFAF',
          subtle: '#A9A39A',
        },
        text: {
          primary: '#F4F1EA',
          secondary: '#B6B0A4',
          muted: '#7C7870',
        },
        border: {
          primary: '#2A2E36',
          focus: '#C8BFAF',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.1)',
        lift: '0 8px 30px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px rgba(200,191,175,0.12), 0 8px 40px rgba(0,0,0,0.45)',
      },
      letterSpacing: {
        widest2: '0.3em',
      },
    },
  },
  plugins: [],
}

