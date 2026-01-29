"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const vitest_1 = require("vitest");
const __1 = require("..");
(0, vitest_1.describe)("bundle", () => {
    (0, vitest_1.it)("handles circular reference with description", async () => {
        const refParser = new __1.$RefParser();
        const pathOrUrlOrSchema = path_1.default.resolve("lib", "__tests__", "spec", "circular-ref-with-description.json");
        const schema = await refParser.bundle({ pathOrUrlOrSchema });
        (0, vitest_1.expect)(schema).toEqual({
            schemas: {
                Bar: {
                    $ref: '#/schemas/Foo',
                    description: 'ok',
                },
                Foo: {
                    $ref: '#/schemas/Bar',
                },
            },
        });
    });
    (0, vitest_1.it)("bundles multiple references to the same file correctly", async () => {
        const refParser = new __1.$RefParser();
        const pathOrUrlOrSchema = path_1.default.resolve("lib", "__tests__", "spec", "multiple-refs.json");
        const schema = (await refParser.bundle({ pathOrUrlOrSchema }));
        // Both parameters should now be $ref to the same internal definition
        const firstParam = schema.paths["/test1/{pathId}"].get.parameters[0];
        const secondParam = schema.paths["/test2/{pathId}"].get.parameters[0];
        // The $ref should match the output structure in file_context_0
        (0, vitest_1.expect)(firstParam.$ref).toBe("#/components/parameters/path-parameter_pathId");
        (0, vitest_1.expect)(secondParam.$ref).toBe("#/components/parameters/path-parameter_pathId");
        // The referenced parameter should exist and match the expected structure
        (0, vitest_1.expect)(schema.components).toBeDefined();
        (0, vitest_1.expect)(schema.components.parameters).toBeDefined();
        (0, vitest_1.expect)(schema.components.parameters["path-parameter_pathId"]).toEqual({
            name: "pathId",
            in: "path",
            required: true,
            schema: {
                type: "string",
                format: "uuid",
                description: "Unique identifier for the path",
            },
        });
    });
});
