

let hasVersion = false;
let version: string;

export function getMiterVersion() {
    if (!hasVersion) {
        version = require('root-require')('package.json').version;
        hasVersion = true;
    }
    return version;
}
