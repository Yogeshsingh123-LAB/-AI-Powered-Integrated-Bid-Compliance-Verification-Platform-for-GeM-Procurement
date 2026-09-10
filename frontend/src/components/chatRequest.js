import { errorText } from './chatText.js';

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
