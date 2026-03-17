export const MINIMAX_ERROR_MESSAGES: Record<number, string> = {
  0: 'Success',
  1000: 'Unknown error occurred. Please try again.',
  1001: 'Request timed out. Please try again.',
  1002: 'Rate limit exceeded. Please wait before retrying.',
  1004: 'API authentication failed.',
  1008: 'Insufficient API balance.',
  1039: 'Text processing limit exceeded. Reduce text length.',
  1042: 'Input contains too many special characters. Remove invisible or control characters.',
  2013: 'Invalid request parameters.',
  2056: 'Text contains unsupported characters.',
};

export function getErrorMessage(statusCode: number): string {
  return MINIMAX_ERROR_MESSAGES[statusCode] ?? `Unknown error (code: ${statusCode})`;
}
