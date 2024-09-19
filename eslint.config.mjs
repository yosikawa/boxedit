import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import googleConfig from "eslint-config-google";

export default [
    {
        files: ["**/*.ts"],
    }, {
        plugins: {
            "@typescript-eslint": typescriptEslint,
            googleConfig
        },
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                project: ['tsconfig.json'],
            },
        },
        rules: {
            eqeqeq: "warn",
            "no-throw-literal": "warn",
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
        },
    },
];
