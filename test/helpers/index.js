function collect(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.setEncoding('utf-8');
    stream.on('end', () => resolve(chunks.join('')));
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => chunks.push(chunk));
  });
}

function makeSamplePlugins() {
  return [{
    resolveId: (id) => id,
    load: () => 'console.log("Hello, World!");'
  }];
}

export {
  collect,
  makeSamplePlugins,
};
