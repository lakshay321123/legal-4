export function appendNoSearchNote(question, hasResults) {
  return hasResults ? question : `${question}\n\nNo recent info found—please clarify.`;
}
