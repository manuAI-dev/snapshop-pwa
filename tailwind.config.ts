import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Portiert aus: app_colors.dart
      colors: {
        primary: {
          DEFAULT: "#F2894F",
          light: "#FEF1E8",
          dark: "#CC3D10",
        },
        secondary: {
          DEFAULT: "#4B164C",
        },
        tertiary: {
          DEFAULT: "#E7DEC4",
        },
        cream: {
          DEFAULT: "#FFF3EB",
          item: "#F9E3D5",
          light: "#FCF7F2",
        },
        accent: {
          blue: "#1C41FF",
          "blue-light": "#E6F5FE",
          purple: "#8FA0F5",
          "purple-light": "#C2C5FF",
          green: "#4CAF50",
          "green-light": "#D7FCDB",
          "green-label": "#11A720",
          "green-bg": "#F0FEE8",
          red: "#E64949",
          "steel-blue": "#6897DB",
          orange: "#FA7A2F",
        },
        heading: "#212022",
        subheading: "#525154",
        grey: {
          DEFAULT: "#5A5A5A",
          text: "#9193A0",
          silver: "#CDD0D8",
          light: "#F8F8F8",
          border: "#DCDDDC",
          category: "#DADADA",
          "category-selected": "#5E6162",
          "category-bg": "#F1F1F1",
          button: "#E2E2E3",
        },
        midnight: {
          blue: "#1A292F",
          navy: "#051B44",
        },
      },

      // Portiert aus: app_theme.dart font declarations
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Montserrat", "system-ui", "sans-serif"],
      },

      // Portiert aus: app_styles.dart text styles
      fontSize: {
        "caption-sm": ["10px", { lineHeight: "14px", fontWeight: "500" }],
        "caption-lg": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "sub-heading": ["18px", { lineHeight: "26px", fontWeight: "600" }],
        heading: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "heading-form": ["28px", { lineHeight: "36px", fontWeight: "500" }],
      },

      // Portiert aus: diverse widgets – border radius values
      borderRadius: {
        sm: "4px",
        DEFAULT: "10px",
        md: "13px",
        lg: "15px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "26px",
        pill: "30px",
        full: "100px",
      },

      // Portiert aus: app_styles.dart, diverse widgets
      boxShadow: {
        light: "0 4px 10px rgba(47, 53, 50, 0.05)",
        card: "0 4px 5px rgba(0, 0, 0, 0.08)",
        button: "0 2px 10px 1px rgba(0, 0, 0, 0.04)",
      },

      // Gradient aus GradientScreenTemplate
      backgroundImage: {
        "gradient-screen":
          "linear-gradient(to bottom, #FFFFFF 20%, #EFF4FD 30%, #EDF8F9 50%, #ECFBF4 80%)",
      },

      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
