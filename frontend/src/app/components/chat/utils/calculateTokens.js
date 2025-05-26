export function calculateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}


export function calculateTotalTokens(messages) {
  return messages.reduce((total, msg) => {
    return total + calculateTokens(msg.text);
  }, 0);
}