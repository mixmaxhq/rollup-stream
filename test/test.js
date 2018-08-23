import test from 'ava';

import rollup from '..';
import {Readable} from 'stream';
import hypothetical from 'rollup-plugin-hypothetical';
import {waitOn} from 'promise-callbacks';
import {collect, makeSamplePlugins} from './helpers';

test('basic api', (t) => {
  t.true(typeof rollup === 'function');
});

test('error without options', async (t) => {
  const s = rollup();
  t.true(s instanceof Readable);
  await t.throwsAsync(waitOn(s, 'data', true), /options must be/i);
});

test('error without options.input', async (t) => {
  const s = rollup({});
  await t.throwsAsync(waitOn(s, 'data', true), /options\.input/i);
});

test('options snapshotting', async (t) => {
  const options = {
    input: './entry.js',
    output: {
      format: 'es'
    },
    plugins: [hypothetical({
      files: {
        './entry.js': 'import x from "./x.js"; console.log(x);',
        './x.js': 'export default "Hello, World!";'
      }
    })]
  };
  const s = rollup(options);
  options.entry = './nonexistent.js';
  t.regex(await collect(s), /Hello, World!/);
});

test('custom rollup', async (t) => {
  const options = {
    input: 'sentinel value',
    rollup: {
      async rollup(opts) {
        t.deepEqual({
          ...opts,
          rollup: options.rollup
        }, options);
        return {
          async generate(opts) {
            t.deepEqual({
              ...opts,
              rollup: options.rollup
            }, options);
            return { code: 'fake code' };
          }
        };
      }
    }
  };
  t.is(await collect(rollup(options)), 'fake code');
});

test('custom rollup: no alarm', async (t) => {
  t.regex(await collect(rollup({
    input : './entry.js',
    output: {
      format: 'es'
    },
    rollup: require('rollup'),
    plugins: makeSamplePlugins()
  })), /Hello, World!/);
});

test('import config from file', async (t) => {
  t.regex(await collect(rollup('test/fixtures/config.js')), /Hello, World!/);
});

test('reject with config file errors', async (t) => {
  const s = rollup('test/fixtures/throws.js');
  await t.throwsAsync(waitOn(s, 'data', true), 'bah! humbug');
});

test("emit a 'bundle' event", async (t) => {
  const s = rollup({
    input: './entry.js',
    output: {
      format: 'es'
    },
    plugins: makeSamplePlugins()
  });

  let bundled = null;
  s.on('bundle', (bundle) => bundled = bundle);

  await t.notThrowsAsync(waitOn(s, 'data', true));

  t.truthy(bundled);
  const {code} = await bundled.generate({ format: 'es' });

  t.regex(code, /Hello, World!/);
});
