

export function delay(millis: number) {
  if (typeof millis !== 'number') throw new Error(`${millis} is not a number!`);
  return new Promise((resolve, _) => {
    setTimeout(resolve, millis);
  });
}
