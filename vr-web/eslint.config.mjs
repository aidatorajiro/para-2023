import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from "globals";
import react from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
    {
        files: ['src/*.{js,jsx,mjs,cjs,ts,tsx}'],
        plugins: {
            react,
            "react-hooks": pluginReactHooks
        },
        settings: {
            react: {
              version: "detect",
            }
        },
        languageOptions: {
            parserOptions: {
              ecmaFeatures: {
                jsx: true,
              },
            },
            globals: {
              ...globals.browser,
            },
        },
        rules: {
            ...pluginReactHooks.configs.recommended.rules,
        }
    },
    {
        ignores: ["dist/**/*", "webpack.config.js", "server-dev.js"]
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended
];