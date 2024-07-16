
export function generateText(length: number): string {
  const baseText = 'Long-TEXT_MESSAGE ';
  const repeatedText = baseText.repeat(Math.ceil(length / baseText.length));
  return repeatedText.slice(0, length);
}
