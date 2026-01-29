"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const __1 = require("..");
const path_1 = __importDefault(require("path"));
(0, vitest_1.describe)("pointer", () => {
    (0, vitest_1.it)("inlines internal JSON Pointer refs under #/paths/ for OpenAPI bundling", async () => {
        const refParser = new __1.$RefParser();
        const pathOrUrlOrSchema = path_1.default.resolve("lib", "__tests__", "spec", "openapi-paths-ref.json");
        const schema = (await refParser.bundle({ pathOrUrlOrSchema }));
        // The GET endpoint should have its schema defined inline
        const getSchema = schema.paths["/foo"].get.responses["200"].content["application/json"].schema;
        (0, vitest_1.expect)(getSchema.$ref).toBeUndefined();
        (0, vitest_1.expect)(getSchema.type).toBe("object");
        (0, vitest_1.expect)(getSchema.properties.bar.type).toBe("string");
        // The POST endpoint should have its schema inlined (copied) instead of a $ref
        const postSchema = schema.paths["/foo"].post.responses["200"].content["application/json"].schema;
        (0, vitest_1.expect)(postSchema.$ref).toBe("#/paths/~1foo/get/responses/200/content/application~1json/schema");
        (0, vitest_1.expect)(postSchema.type).toBeUndefined();
        (0, vitest_1.expect)(postSchema.properties?.bar?.type).toBeUndefined();
        // Both schemas should be identical objects
        (0, vitest_1.expect)(postSchema).not.toBe(getSchema);
    });
});
