import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from "globals";
import react from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    { 
      ...react.configs.flat.recommended,
      settings: {
        react: {
          version: "detect",
        }
      }
    },
    react.configs.flat['jsx-runtime'],
    {
        files: ['src/*.{js,jsx,mjs,cjs,ts,tsx}'],
        plugins: {
            "react-hooks": pluginReactHooks
        },
        languageOptions: {
            globals: {
              ...globals.browser,
            },
        },
        rules: {
            ...pluginReactHooks.configs.recommended.rules,
            "@typescript-eslint/no-wrapper-object-types": "off",
            "@typescript-eslint/no-empty-object-type": "off"
        }
    },
    {
        ignores: ["dist/**/*", "webpack.config.js", "server-dev.js"]
    }
];