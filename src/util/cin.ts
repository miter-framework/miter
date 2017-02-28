import { createInterface, ReadLine } from 'readline';

export interface ReadLineAsync {
    readline(): Promise<string>,
    native: ReadLine,
    pause: () => void,
    resume: () => void,
    emit: (line: string) => void
}

const nativeCin = createInterface({
    input: process.stdin,
    output: process.stdout
});
let resolveFns: { (str: string): void }[] = [];
function emitLine(line: string) {
    if (!resolveFns.length) return;
    let resolveFn = resolveFns.splice(0, 1)[0];
    resolveFn(line.trim());
}
nativeCin.on('line', (line: string) => emitLine(line));
export const cin: ReadLineAsync = {
    readline: () => {
        return new Promise((resolve, reject) => {
            resolveFns.push(resolve);
            nativeCin.prompt();
        });
    },
    native: nativeCin,
    pause: () => void nativeCin.pause(),
    resume: () => void nativeCin.resume(),
    emit: (line: string) => emitLine(line)
};
