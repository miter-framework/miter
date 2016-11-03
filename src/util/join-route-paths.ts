

export function joinRoutePaths(...paths: string[]): string {
   let partial = '/';
   for (var q = 0; q < paths.length; q++) {
      let path = paths[q];
      if (!path || path == '/') continue;
      if (path.startsWith('/')) path = path.substring(1);
      if (path && !partial.endsWith('/')) partial += '/';
      partial += path;
   }
   return partial;
}
