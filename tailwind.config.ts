import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        brand: {
          royal: '#1512D3',
          'royal-deep': '#0E0CA8',
          'royal-tint': '#E8E7FA',
        },
        surface: {
          white: '#FFFFFF',
          cream: '#FAF7F2',
          ink: '#0A0A0F',
        },
        text: {
          ink: '#0A0A0F',
          muted: '#5A5A66',
          faint: '#9899A1',
          inverse: '#FFFFFF',
        },
        stroke: {
          hairline: '#E8E8EC',
          strong: '#0A0A0F',
        },
        state: {
          success: '#1A7F5A',
          warning: '#9C6B0A',
          danger: '#A02A2A',
        },
        tier: {
          foundation: '#9CA3AF',
          thinker: '#7B9FFF',
          founding: '#1512D3',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: '8px',
      },
      fontFamily: {
        serif: ['"PP Editorial New"', 'Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-hero': ['48px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-h1': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-h2': ['24px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'heading-lg': ['20px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'heading-md': ['16px', { lineHeight: '1.3' }],
        'body-lg': ['16px', { lineHeight: '1.5' }],
        'body-md': ['14px', { lineHeight: '1.5' }],
        'body-sm': ['13px', { lineHeight: '1.4' }],
        label: ['12px', { lineHeight: '1.3', letterSpacing: '0.04em' }],
        mono: ['13px', { lineHeight: '1.4' }],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
