import { parseData } from '/src/utils/parser.js';

self.onmessage = (e) => {
  const { file, index, name } = e.data;
  parseData(file, (parsedData) => {
    postMessage({ parsedData, index, name });
  });
};