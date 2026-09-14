import { errorText } from './chatText.js';

// Provider replies can exceed the API's 4,000-character history limit.
// Bound only the context sent back; preserve the full visible conversation.
export function buildChatHistory(messages) {
  return messages
    .filter(message => message.id !== 'welcome' && !message.isError &&
      ['user', 'assistant'].includes(message.role) && typeof message.content === 'string' && message.content.trim())
    .slice(-10)
    .map(({ role, content }) => ({ role, content: Array.from(content).slice(0, 4000).join('') }));
}

export function validateChatResponse(data) {
  if (!data || typeof data.answer !== 'string' || !data.answer.trim()) {
    throw new Error('Invalid chat response');
  }
  return { ...data, suggestions: Array.isArray(data.suggestions)
    ? data.suggestions.filter(value => typeof value === 'string' && value.trim()) : [] };
}

// Background refreshes must not overwrite the foreground form's error state.
export async function requestChatJson(fetcher, path, options, { signal, quiet, isCurrent, onError, translations }) {
  try {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    const response = await fetcher(path, { ...options, signal, headers });
    if (!response.ok) {
      const failure = new Error('Request failed');
      failure.status = response.status;
      throw failure;
    }
    const result = response.status === 204 ? {} : await response.json();
    return isCurrent() ? result : null;
  } catch (error) {
    if (isCurrent() && !quiet) onError(errorText(error.status, translations));
    return null;
  }
}
