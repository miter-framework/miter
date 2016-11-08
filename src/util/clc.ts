import clc = require('cli-color');
declare module 'cli-color' {
   interface Format {
      info: Format;
      error: Format;
      warn: Format;
   }
}
clc.info = clc.cyan;
clc.error = clc.redBright;
clc.warn = clc.yellowBright;
export { clc };
