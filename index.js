const {Readable} = require('stream');
const path = require('path');

module.exports = function rollupStream(options) {
  const stream = new Readable();
  stream._read = function() {};

  if (typeof options === 'object' && options !== null) {
    options = Promise.resolve(options);
  } else if (typeof options === 'string') {
    const optionsPath = path.resolve(options);
    options = require('rollup').rollup({
      input: optionsPath,
      onwarn(warning) {
        if (warning.code !== 'UNRESOLVED_IMPORT') {
          console.warn(warning.message);
        }
      },
    }).then((bundle) => {
      return bundle.generate({ format: 'cjs' });
    }).then(({code}) => {
      // don't look at me. this is how Rollup does it.
      const defaultLoader = require.extensions['.js'];

      require.extensions['.js'] = function bypassLoader(m, filename) {
        if (filename === optionsPath) {
          m._compile(code, filename);
        } else {
          defaultLoader(m, filename);
        }
      };

      try {
        return require(optionsPath);
      } finally {
        require.extensions['.js'] = defaultLoader;
      }
    });
  } else {
    options = Promise.reject(new Error('options must be an object or a string!'));
  }

  options.then((resolvedOptions) => {
    let hasCustomRollup = true, {rollup} = resolvedOptions;
    if (!rollup) {
      rollup = require('rollup');
      hasCustomRollup = false;
    }

    const finalOptions = {};
    for (const key in resolvedOptions) {
      if (key === 'sourceMap' && !hasCustomRollup) {
        console.warn(
          'The sourceMap option has been renamed to "sourcemap" ' +
          '(lowercase "m") in Rollup. The old form is now deprecated ' +
          'in rollup-stream.'
        );
        finalOptions.sourcemap = resolvedOptions.sourceMap;
      } else if (key !== 'rollup') {
        finalOptions[key] = resolvedOptions[key];
      }
    }

    return rollup.rollup(finalOptions).then((bundle) => {
      stream.emit('bundle', bundle);

      return bundle.generate(finalOptions);
    }).then(({code, map}) => {
      stream.push(code);
      if (finalOptions.sourcemap || finalOptions.sourceMap || (finalOptions.output && finalOptions.output.sourcemap)) {
        stream.push(`\n//# sourceMappingURL=${map.toUrl()}`);
      }
      stream.push(null);
    });
  }).catch((reason) => {
    setImmediate(() => stream.emit('error', reason));
  });

  return stream;
};
