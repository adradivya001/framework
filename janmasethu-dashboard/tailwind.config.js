/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#2563eb", // Medical Blue
                    foreground: "#ffffff",
                },
                emergency: {
                    DEFAULT: "#ef4444", // Red
                    foreground: "#ffffff",
                },
                warning: {
                    DEFAULT: "#f59e0b", // Yellow/Amber
                    foreground: "#ffffff",
                },
                success: {
                    DEFAULT: "#10b981", // Green
                    foreground: "#ffffff",
                },
                background: "#f8fafc",
                card: "#ffffff",
                border: "#e2e8f0",
            },
            borderRadius: {
                lg: "0.5rem",
                md: "0.375rem",
                sm: "0.25rem",
            },
        },
    },
    plugins: [],
};
