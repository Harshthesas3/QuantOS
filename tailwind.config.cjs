module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D0E12',
          secondary: '#121318',
          tertiary: '#27272A',
          hover: '#3F3F46',
        },
        accent: {
          primary: '#38BDF8',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
        border: {
          primary: '#27272A',
          focus: '#38BDF8',
        },
      },
    },
  },
  plugins: [],
}
