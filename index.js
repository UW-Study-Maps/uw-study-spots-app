// Custom entry point, purely for startup diagnosis.
//
// `require` rather than `import`: ES imports are hoisted, so an `import` here
// would run expo-router's entry BEFORE the trace and defeat the purpose. If
// "entry: bundle evaluating" never appears, the bundle itself never ran —
// a native crash or a Metro failure, not an app bug.
const { trace, traceError } = require("./src/lib/trace");

trace("entry: bundle evaluating");

try {
  require("expo-router/entry");
  trace("entry: expo-router/entry loaded");
} catch (error) {
  traceError("entry: expo-router/entry threw", error);
  throw error;
}
