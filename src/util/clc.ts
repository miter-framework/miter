import clc = require('cli-color');

declare module 'cli-color' {
  interface Color {
    info: clc.Format;
    error: clc.Format;
    warn: clc.Format;
  }
}
clc.info = clc.cyan;
clc.error = clc.redBright;
clc.warn = clc.yellowBright;

export { clc };
