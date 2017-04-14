import { createInterface, ReadLine } from 'readline';

export interface ReadLineAsync {
    readline(): Promise<string>,
    getNative: () => ReadLine,
    pause: () => void,
    resume: () => void,
    emit: (line: string) => void
}

let nativeCin: ReadLine | null = null;
function getNativeCin() {
    if (!nativeCin) {
        nativeCin = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        nativeCin.on('line', (line: string) => emitLine(line));
    }
    return nativeCin;
}
let resolveFns: { (str: string): void }[] = [];
function emitLine(line: string) {
    if (!resolveFns.length) return;
    let resolveFn = resolveFns.splice(0, 1)[0];
    resolveFn(line.trim());
}
export const cin: ReadLineAsync = {
    readline: () => {
        return new Promise((resolve, reject) => {
            resolveFns.push(resolve);
            getNativeCin().prompt();
        });
    },
    getNative: getNativeCin,
    pause: () => void getNativeCin().pause(),
    resume: () => void getNativeCin().resume(),
    emit: (line: string) => emitLine(line)
};
