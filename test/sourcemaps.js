import test from 'ava';

import rollup from '..';
import {collect, makeSamplePlugins} from './helpers';

test('options.sourcemaps support', async (t) => {
  const data = await collect(rollup({
    input: './entry.js',
    output: {
      format: 'es',
      sourcemap: true
    },
    plugins: makeSamplePlugins()
  }));
  t.true(data.includes('\n//# sourceMappingURL=data:application/json;'));
});

test('no sourcemaps by default', async (t) => {
  const data = await collect(rollup({
    input: './entry.js',
    output: {
      format: 'es'
    },
    plugins: makeSamplePlugins()
  }));
  t.false(data.includes('\n//# sourceMappingURL=data:application/json;'));
});
