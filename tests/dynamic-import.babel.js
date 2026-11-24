// Jest runs tests as CommonJS without --experimental-vm-modules, where import()
// throws. Rewrites import(source) to a deferred require so modules load through
// Jest's registry, after any jest.doMock registered before the call.
module.exports = function dynamicImportToRequire({ template }) {
  const buildRequire = template.expression(
    'Promise.resolve().then(() => require(SOURCE))'
  );

  return {
    name: 'jest-dynamic-import-to-require',
    visitor: {
      CallExpression(path) {
        if (path.node.callee.type === 'Import') {
          path.replaceWith(buildRequire({ SOURCE: path.node.arguments[0] }));
        }
      }
    }
  };
};
