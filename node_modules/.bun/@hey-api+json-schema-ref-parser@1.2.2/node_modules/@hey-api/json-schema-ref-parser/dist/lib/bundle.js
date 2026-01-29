"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundle = void 0;
const ref_js_1 = __importDefault(require("./ref.js"));
const pointer_js_1 = __importDefault(require("./pointer.js"));
const url = __importStar(require("./util/url.js"));
const DEBUG_PERFORMANCE = process.env.DEBUG === "true" ||
    (typeof globalThis !== "undefined" && globalThis.DEBUG_BUNDLE_PERFORMANCE === true);
const perf = {
    mark: (name) => DEBUG_PERFORMANCE && performance.mark(name),
    measure: (name, start, end) => DEBUG_PERFORMANCE && performance.measure(name, start, end),
    log: (message, ...args) => DEBUG_PERFORMANCE && console.log("[PERF] " + message, ...args),
    warn: (message, ...args) => DEBUG_PERFORMANCE && console.warn("[PERF] " + message, ...args),
};
/**
 * Fast lookup using Map instead of linear search with deep equality
 */
const createInventoryLookup = () => {
    const lookup = new Map();
    const objectIds = new WeakMap(); // Use WeakMap to avoid polluting objects
    let idCounter = 0;
    let lookupCount = 0;
    let addCount = 0;
    const getObjectId = (obj) => {
        if (!objectIds.has(obj)) {
            objectIds.set(obj, `obj_${++idCounter}`);
        }
        return objectIds.get(obj);
    };
    const createInventoryKey = ($refParent, $refKey) => {
        // Use WeakMap-based lookup to avoid polluting the actual schema objects
        return `${getObjectId($refParent)}_${$refKey}`;
    };
    return {
        add: (entry) => {
            addCount++;
            const key = createInventoryKey(entry.parent, entry.key);
            lookup.set(key, entry);
            if (addCount % 100 === 0) {
                perf.log(`Inventory lookup: Added ${addCount} entries, map size: ${lookup.size}`);
            }
        },
        find: ($refParent, $refKey) => {
            lookupCount++;
            const key = createInventoryKey($refParent, $refKey);
            const result = lookup.get(key);
            if (lookupCount % 100 === 0) {
                perf.log(`Inventory lookup: ${lookupCount} lookups performed`);
            }
            return result;
        },
        remove: (entry) => {
            const key = createInventoryKey(entry.parent, entry.key);
            lookup.delete(key);
        },
        getStats: () => ({ lookupCount, addCount, mapSize: lookup.size }),
    };
};
/**
 * Determine the container type from a JSON Pointer path.
 * Analyzes the path tokens to identify the appropriate OpenAPI component container.
 *
 * @param path - The JSON Pointer path to analyze
 * @returns The container type: "schemas", "parameters", "requestBodies", "responses", or "headers"
 */
const getContainerTypeFromPath = (path) => {
    const tokens = pointer_js_1.default.parse(path);
    const has = (t) => tokens.includes(t);
    // Prefer more specific containers first
    if (has("parameters")) {
        return "parameters";
    }
    if (has("requestBody")) {
        return "requestBodies";
    }
    if (has("headers")) {
        return "headers";
    }
    if (has("responses")) {
        return "responses";
    }
    if (has("schema")) {
        return "schemas";
    }
    // default: treat as schema-like
    return "schemas";
};
/**
 * Inventories the given JSON Reference (i.e. records detailed information about it so we can
 * optimize all $refs in the schema), and then crawls the resolved value.
 */
const inventory$Ref = ({ $refKey, $refParent, $refs, indirections, inventory, inventoryLookup, options, path, pathFromRoot, visitedObjects = new WeakSet(), resolvedRefs = new Map(), }) => {
    perf.mark("inventory-ref-start");
    const $ref = $refKey === null ? $refParent : $refParent[$refKey];
    const $refPath = url.resolve(path, $ref.$ref);
    // Check cache first to avoid redundant resolution
    let pointer = resolvedRefs.get($refPath);
    if (!pointer) {
        perf.mark("resolve-start");
        pointer = $refs._resolve($refPath, pathFromRoot, options);
        perf.mark("resolve-end");
        perf.measure("resolve-time", "resolve-start", "resolve-end");
        if (pointer) {
            resolvedRefs.set($refPath, pointer);
            perf.log(`Cached resolved $ref: ${$refPath}`);
        }
    }
    if (pointer === null) {
        perf.mark("inventory-ref-end");
        perf.measure("inventory-ref-time", "inventory-ref-start", "inventory-ref-end");
        return;
    }
    const parsed = pointer_js_1.default.parse(pathFromRoot);
    const depth = parsed.length;
    const file = url.stripHash(pointer.path);
    const hash = url.getHash(pointer.path);
    const external = file !== $refs._root$Ref.path;
    const extended = ref_js_1.default.isExtended$Ref($ref);
    indirections += pointer.indirections;
    // Check if this exact location (parent + key + pathFromRoot) has already been inventoried
    perf.mark("lookup-start");
    const existingEntry = inventoryLookup.find($refParent, $refKey);
    perf.mark("lookup-end");
    perf.measure("lookup-time", "lookup-start", "lookup-end");
    if (existingEntry && existingEntry.pathFromRoot === pathFromRoot) {
        // This exact location has already been inventoried, so we don't need to process it again
        if (depth < existingEntry.depth || indirections < existingEntry.indirections) {
            removeFromInventory(inventory, existingEntry);
            inventoryLookup.remove(existingEntry);
        }
        else {
            perf.mark("inventory-ref-end");
            perf.measure("inventory-ref-time", "inventory-ref-start", "inventory-ref-end");
            return;
        }
    }
    const newEntry = {
        $ref, // The JSON Reference (e.g. {$ref: string})
        circular: pointer.circular, // Is this $ref pointer DIRECTLY circular? (i.e. it references itself)
        depth, // How far from the JSON Schema root is this $ref pointer?
        extended, // Does this $ref extend its resolved value? (i.e. it has extra properties, in addition to "$ref")
        external, // Does this $ref pointer point to a file other than the main JSON Schema file?
        file, // The file that the $ref pointer resolves to
        hash, // The hash within `file` that the $ref pointer resolves to
        indirections, // The number of indirect references that were traversed to resolve the value
        key: $refKey, // The key in `parent` that is the $ref pointer
        parent: $refParent, // The object that contains this $ref pointer
        pathFromRoot, // The path to the $ref pointer, from the JSON Schema root
        value: pointer.value, // The resolved value of the $ref pointer
        originalContainerType: external ? getContainerTypeFromPath(pointer.path) : undefined, // The original container type in the external file
    };
    inventory.push(newEntry);
    inventoryLookup.add(newEntry);
    perf.log(`Inventoried $ref: ${$ref.$ref} -> ${file}${hash} (external: ${external}, depth: ${depth})`);
    // Recursively crawl the resolved value
    if (!existingEntry || external) {
        perf.mark("crawl-recursive-start");
        crawl({
            parent: pointer.value,
            key: null,
            path: pointer.path,
            pathFromRoot,
            indirections: indirections + 1,
            inventory,
            inventoryLookup,
            $refs,
            options,
            visitedObjects,
            resolvedRefs,
        });
        perf.mark("crawl-recursive-end");
        perf.measure("crawl-recursive-time", "crawl-recursive-start", "crawl-recursive-end");
    }
    perf.mark("inventory-ref-end");
    perf.measure("inventory-ref-time", "inventory-ref-start", "inventory-ref-end");
};
/**
 * Recursively crawls the given value, and inventories all JSON references.
 */
const crawl = ({ $refs, indirections, inventory, inventoryLookup, key, options, parent, path, pathFromRoot, visitedObjects = new WeakSet(), resolvedRefs = new Map(), }) => {
    const obj = key === null ? parent : parent[key];
    if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj)) {
        // Early exit if we've already processed this exact object
        if (visitedObjects.has(obj)) {
            perf.log(`Skipping already visited object at ${pathFromRoot}`);
            return;
        }
        if (ref_js_1.default.isAllowed$Ref(obj)) {
            perf.log(`Found $ref at ${pathFromRoot}: ${obj.$ref}`);
            inventory$Ref({
                $refParent: parent,
                $refKey: key,
                path,
                pathFromRoot,
                indirections,
                inventory,
                inventoryLookup,
                $refs,
                options,
                visitedObjects,
                resolvedRefs,
            });
        }
        else {
            // Mark this object as visited BEFORE processing its children
            visitedObjects.add(obj);
            // Crawl the object in a specific order that's optimized for bundling.
            // This is important because it determines how `pathFromRoot` gets built,
            // which later determines which keys get dereferenced and which ones get remapped
            const keys = Object.keys(obj).sort((a, b) => {
                // Most people will expect references to be bundled into the "definitions" property,
                // so we always crawl that property first, if it exists.
                if (a === "definitions") {
                    return -1;
                }
                else if (b === "definitions") {
                    return 1;
                }
                else {
                    // Otherwise, crawl the keys based on their length.
                    // This produces the shortest possible bundled references
                    return a.length - b.length;
                }
            });
            for (const key of keys) {
                const keyPath = pointer_js_1.default.join(path, key);
                const keyPathFromRoot = pointer_js_1.default.join(pathFromRoot, key);
                const value = obj[key];
                if (ref_js_1.default.isAllowed$Ref(value)) {
                    inventory$Ref({
                        $refParent: obj,
                        $refKey: key,
                        path,
                        pathFromRoot: keyPathFromRoot,
                        indirections,
                        inventory,
                        inventoryLookup,
                        $refs,
                        options,
                        visitedObjects,
                        resolvedRefs,
                    });
                }
                else {
                    crawl({
                        parent: obj,
                        key,
                        path: keyPath,
                        pathFromRoot: keyPathFromRoot,
                        indirections,
                        inventory,
                        inventoryLookup,
                        $refs,
                        options,
                        visitedObjects,
                        resolvedRefs,
                    });
                }
            }
        }
    }
};
/**
 * Remap external refs by hoisting resolved values into a shared container in the root schema
 * and pointing all occurrences to those internal definitions. Internal refs remain internal.
 */
function remap(parser, inventory) {
    perf.log(`Starting remap with ${inventory.length} inventory entries`);
    perf.mark("remap-start");
    const root = parser.schema;
    // Group & sort all the $ref pointers, so they're in the order that we need to dereference/remap them
    perf.mark("sort-inventory-start");
    inventory.sort((a, b) => {
        if (a.file !== b.file) {
            // Group all the $refs that point to the same file
            return a.file < b.file ? -1 : +1;
        }
        else if (a.hash !== b.hash) {
            // Group all the $refs that point to the same part of the file
            return a.hash < b.hash ? -1 : +1;
        }
        else if (a.circular !== b.circular) {
            // If the $ref points to itself, then sort it higher than other $refs that point to this $ref
            return a.circular ? -1 : +1;
        }
        else if (a.extended !== b.extended) {
            // If the $ref extends the resolved value, then sort it lower than other $refs that don't extend the value
            return a.extended ? +1 : -1;
        }
        else if (a.indirections !== b.indirections) {
            // Sort direct references higher than indirect references
            return a.indirections - b.indirections;
        }
        else if (a.depth !== b.depth) {
            // Sort $refs by how close they are to the JSON Schema root
            return a.depth - b.depth;
        }
        else {
            // Determine how far each $ref is from the "definitions" property.
            // Most people will expect references to be bundled into the the "definitions" property if possible.
            const aDefinitionsIndex = a.pathFromRoot.lastIndexOf("/definitions");
            const bDefinitionsIndex = b.pathFromRoot.lastIndexOf("/definitions");
            if (aDefinitionsIndex !== bDefinitionsIndex) {
                // Give higher priority to the $ref that's closer to the "definitions" property
                return bDefinitionsIndex - aDefinitionsIndex;
            }
            else {
                // All else is equal, so use the shorter path, which will produce the shortest possible reference
                return a.pathFromRoot.length - b.pathFromRoot.length;
            }
        }
    });
    perf.mark("sort-inventory-end");
    perf.measure("sort-inventory-time", "sort-inventory-start", "sort-inventory-end");
    perf.log(`Sorted ${inventory.length} inventory entries`);
    // Ensure or return a container by component type. Prefer OpenAPI-aware placement;
    // otherwise use existing root containers; otherwise create components/*.
    const ensureContainer = (type) => {
        const isOas3 = !!(root && typeof root === "object" && typeof root.openapi === "string");
        const isOas2 = !!(root && typeof root === "object" && typeof root.swagger === "string");
        if (isOas3) {
            if (!root.components || typeof root.components !== "object") {
                root.components = {};
            }
            if (!root.components[type] || typeof root.components[type] !== "object") {
                root.components[type] = {};
            }
            return { obj: root.components[type], prefix: `#/components/${type}` };
        }
        if (isOas2) {
            if (type === "schemas") {
                if (!root.definitions || typeof root.definitions !== "object") {
                    root.definitions = {};
                }
                return { obj: root.definitions, prefix: "#/definitions" };
            }
            if (type === "parameters") {
                if (!root.parameters || typeof root.parameters !== "object") {
                    root.parameters = {};
                }
                return { obj: root.parameters, prefix: "#/parameters" };
            }
            if (type === "responses") {
                if (!root.responses || typeof root.responses !== "object") {
                    root.responses = {};
                }
                return { obj: root.responses, prefix: "#/responses" };
            }
            // requestBodies/headers don't exist as reusable containers in OAS2; fallback to definitions
            if (!root.definitions || typeof root.definitions !== "object") {
                root.definitions = {};
            }
            return { obj: root.definitions, prefix: "#/definitions" };
        }
        // No explicit version: prefer existing containers
        if (root && typeof root === "object") {
            if (root.components && typeof root.components === "object") {
                if (!root.components[type] || typeof root.components[type] !== "object") {
                    root.components[type] = {};
                }
                return { obj: root.components[type], prefix: `#/components/${type}` };
            }
            if (root.definitions && typeof root.definitions === "object") {
                return { obj: root.definitions, prefix: "#/definitions" };
            }
            // Create components/* by default if nothing exists
            if (!root.components || typeof root.components !== "object") {
                root.components = {};
            }
            if (!root.components[type] || typeof root.components[type] !== "object") {
                root.components[type] = {};
            }
            return { obj: root.components[type], prefix: `#/components/${type}` };
        }
        // Fallback
        root.definitions = root.definitions || {};
        return { obj: root.definitions, prefix: "#/definitions" };
    };
    /**
     * Choose the appropriate component container for bundling.
     * Prioritizes the original container type from external files over usage location.
     *
     * @param entry - The inventory entry containing reference information
     * @returns The container type to use for bundling
     */
    const chooseComponent = (entry) => {
        // If we have the original container type from the external file, use it
        if (entry.originalContainerType) {
            return entry.originalContainerType;
        }
        // Fallback to usage path for internal references or when original type is not available
        return getContainerTypeFromPath(entry.pathFromRoot);
    };
    // Track names per (container prefix) and per target
    const targetToNameByPrefix = new Map();
    const usedNamesByObj = new Map();
    const sanitize = (name) => name.replace(/[^A-Za-z0-9_-]/g, "_");
    const baseName = (filePath) => {
        try {
            const withoutHash = filePath.split("#")[0];
            const parts = withoutHash.split("/");
            const filename = parts[parts.length - 1] || "schema";
            const dot = filename.lastIndexOf(".");
            return sanitize(dot > 0 ? filename.substring(0, dot) : filename);
        }
        catch {
            return "schema";
        }
    };
    const lastToken = (hash) => {
        if (!hash || hash === "#") {
            return "root";
        }
        const tokens = hash.replace(/^#\//, "").split("/");
        return sanitize(tokens[tokens.length - 1] || "root");
    };
    const uniqueName = (containerObj, proposed) => {
        if (!usedNamesByObj.has(containerObj)) {
            usedNamesByObj.set(containerObj, new Set(Object.keys(containerObj || {})));
        }
        const used = usedNamesByObj.get(containerObj);
        let name = proposed;
        let i = 2;
        while (used.has(name)) {
            name = `${proposed}_${i++}`;
        }
        used.add(name);
        return name;
    };
    perf.mark("remap-loop-start");
    for (const entry of inventory) {
        // Safety check: ensure entry and entry.$ref are valid objects
        if (!entry || !entry.$ref || typeof entry.$ref !== "object") {
            perf.warn(`Skipping invalid inventory entry:`, entry);
            continue;
        }
        // Keep internal refs internal. However, if the $ref extends the resolved value
        // (i.e. it has additional properties in addition to "$ref"), then we must
        // preserve the original $ref rather than rewriting it to the resolved hash.
        if (!entry.external) {
            if (!entry.extended && entry.$ref && typeof entry.$ref === "object") {
                entry.$ref.$ref = entry.hash;
            }
            continue;
        }
        // Avoid changing direct self-references; keep them internal
        if (entry.circular) {
            if (entry.$ref && typeof entry.$ref === "object") {
                entry.$ref.$ref = entry.pathFromRoot;
            }
            continue;
        }
        // Choose appropriate container based on original location in external file
        const component = chooseComponent(entry);
        const { obj: container, prefix } = ensureContainer(component);
        const targetKey = `${entry.file}::${entry.hash}`;
        if (!targetToNameByPrefix.has(prefix)) {
            targetToNameByPrefix.set(prefix, new Map());
        }
        const namesForPrefix = targetToNameByPrefix.get(prefix);
        let defName = namesForPrefix.get(targetKey);
        if (!defName) {
            // If the external file is one of the original input sources, prefer its assigned prefix
            let proposedBase = baseName(entry.file);
            try {
                const parserAny = parser;
                if (parserAny && parserAny.sourcePathToPrefix && typeof parserAny.sourcePathToPrefix.get === "function") {
                    const withoutHash = (entry.file || "").split("#")[0];
                    const mapped = parserAny.sourcePathToPrefix.get(withoutHash);
                    if (mapped && typeof mapped === "string") {
                        proposedBase = mapped;
                    }
                }
            }
            catch {
                // Ignore errors
            }
            const proposed = `${proposedBase}_${lastToken(entry.hash)}`;
            defName = uniqueName(container, proposed);
            namesForPrefix.set(targetKey, defName);
            // Store the resolved value under the container
            container[defName] = entry.value;
        }
        // Point the occurrence to the internal definition, preserving extensions
        const refPath = `${prefix}/${defName}`;
        if (entry.extended && entry.$ref && typeof entry.$ref === "object") {
            entry.$ref.$ref = refPath;
        }
        else {
            entry.parent[entry.key] = { $ref: refPath };
        }
    }
    perf.mark("remap-loop-end");
    perf.measure("remap-loop-time", "remap-loop-start", "remap-loop-end");
    perf.mark("remap-end");
    perf.measure("remap-total-time", "remap-start", "remap-end");
    perf.log(`Completed remap of ${inventory.length} entries`);
}
function removeFromInventory(inventory, entry) {
    const index = inventory.indexOf(entry);
    inventory.splice(index, 1);
}
/**
 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
 * only has *internal* references, not any *external* references.
 * This method mutates the JSON schema object, adding new references and re-mapping existing ones.
 *
 * @param parser
 * @param options
 */
const bundle = (parser, options) => {
    // console.log('Bundling $ref pointers in %s', parser.$refs._root$Ref.path);
    perf.mark("bundle-start");
    // Build an inventory of all $ref pointers in the JSON Schema
    const inventory = [];
    const inventoryLookup = createInventoryLookup();
    perf.log("Starting crawl phase");
    perf.mark("crawl-phase-start");
    const visitedObjects = new WeakSet();
    const resolvedRefs = new Map(); // Cache for resolved $ref targets
    crawl({
        parent: parser,
        key: "schema",
        path: parser.$refs._root$Ref.path + "#",
        pathFromRoot: "#",
        indirections: 0,
        inventory,
        inventoryLookup,
        $refs: parser.$refs,
        options,
        visitedObjects,
        resolvedRefs,
    });
    perf.mark("crawl-phase-end");
    perf.measure("crawl-phase-time", "crawl-phase-start", "crawl-phase-end");
    const stats = inventoryLookup.getStats();
    perf.log(`Crawl phase complete. Found ${inventory.length} $refs. Lookup stats:`, stats);
    // Remap all $ref pointers
    perf.log("Starting remap phase");
    perf.mark("remap-phase-start");
    remap(parser, inventory);
    perf.mark("remap-phase-end");
    perf.measure("remap-phase-time", "remap-phase-start", "remap-phase-end");
    perf.mark("bundle-end");
    perf.measure("bundle-total-time", "bundle-start", "bundle-end");
    perf.log("Bundle complete. Performance summary:");
    // Log final stats
    const finalStats = inventoryLookup.getStats();
    perf.log(`Final inventory stats:`, finalStats);
    perf.log(`Resolved refs cache size: ${resolvedRefs.size}`);
    if (DEBUG_PERFORMANCE) {
        // Log all performance measures
        const measures = performance.getEntriesByType("measure");
        measures.forEach((measure) => {
            if (measure.name.includes("time")) {
                console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`);
            }
        });
        // Clear performance marks and measures for next run
        performance.clearMarks();
        performance.clearMeasures();
    }
};
exports.bundle = bundle;
