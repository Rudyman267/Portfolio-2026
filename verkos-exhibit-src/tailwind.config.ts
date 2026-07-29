import type { Config } from "tailwindcss";
import colorsConfig from "./src/libs/shared/configs/colors";
import typographyConfig from "./src/libs/shared/configs/typography";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./index.html",
  ],
  prefix: "",
  important: true,
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        xxs: "340px",
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
        "3xl": "1920px", // 1080p displays
        "4xl": "2560px", // 1440p displays
        "5xl": "3840px", // 4K displays
      },
    },
    extend: {
      // FlytBase Design System Colors
      colors: {
        ...colorsConfig.getTailwindColors(),
        // Keep Lovable/shadcn colors for compatibility with existing components
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        "fira-code": ["Fira Code", "monospace"],
        "dm-sans": ["DM Sans", "sans-serif"],
      },
      letterSpacing: {
        narrow: "-0.006em",
        "narrow-alt": "-0.003em",
        normal: "0em",
        wide: "0.0015em",
        "wide-alt": "0.003em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        focus: "0px 0px 0px rgba(0, 128, 255, 1)",
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
        "demoFramePulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "demoFramePulse": "demoFramePulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // FlytBase Typography Utilities
    function ({ addUtilities }: any) {
      const typographyUtils = typographyConfig.getTailwindTypography();
      addUtilities(typographyUtils, ["responsive", "hover"]);
    },
  ],
} satisfies Config;

export default config;
