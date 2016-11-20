import { createInterface, ReadLine } from 'readline';

export interface ReadLineAsync {
   readline(): Promise<string>,
   native: ReadLine
}

const nativeCin = createInterface({
   input: process.stdin,
   output: process.stdout
});
let resolveFns: { (str: string): void }[] = [];
nativeCin.on('line', (line: string) => {
   if (!resolveFns.length) return;
   let resolveFn = resolveFns.splice(0, 1)[0];
   resolveFn(line.trim());
});
export const cin: ReadLineAsync = {
   readline: () => {
      return new Promise((resolve, reject) => {
         resolveFns.push(resolve);
         nativeCin.prompt();
      });
   },
   native: nativeCin
};
