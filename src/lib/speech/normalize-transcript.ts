/** Cleans STT output: collapse spaces and separate digits from adjacent letters (e.g. "05thời" → "05 thời"). */
export function normalizeSpeechText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2")
    .replace(/(\d)([^\d\s.,!?;:])/g, "$1 $2")
    .replace(/([^\d\s.,!?;:])(\d)/g, "$1 $2")
    .trim();
}
