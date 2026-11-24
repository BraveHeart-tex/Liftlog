// Jest runs tests as CommonJS, where import.meta does not exist. Rewrites
// import.meta.url, .dirname and .filename to their CommonJS equivalents before
// babel-preset-expo rejects or polyfills import.meta.
module.exports = function importMetaToCommonJs({ template }) {
  const buildImportMeta = template.expression.ast`({
    url: require('node:url').pathToFileURL(__filename).href,
    dirname: __dirname,
    filename: __filename
  })`;

  return {
    name: 'jest-import-meta-to-commonjs',
    visitor: {
      MetaProperty(path) {
        if (
          path.node.meta.name === 'import' &&
          path.node.property.name === 'meta'
        ) {
          path.replaceWith(buildImportMeta);
        }
      }
    }
  };
};
