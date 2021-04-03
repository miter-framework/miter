import * as nativeReadline from 'readline';
import { wrapPromise } from '../util/wrap-promise';

export type ClearDirection = 'left' | 'right' | 'entire';
function translateClearDirection(dir: ClearDirection) {
  if (dir == 'left') return -1;
  else if (dir == 'right') return 1;
  else return 0;
}

export const cout = {
  clearLine: (dir: ClearDirection = 'entire') => nativeReadline.clearLine(process.stdout, translateClearDirection(dir)),
  cursorTo: (x: number, y: number) => nativeReadline.cursorTo(process.stdout, x, y),
  moveCursor: (dx: number, dy: number) => nativeReadline.moveCursor(process.stdout, dx, dy),
  write: (str: string) => wrapPromise(process.stdout.write.bind(process.stdout), str),
  native: nativeReadline
};
