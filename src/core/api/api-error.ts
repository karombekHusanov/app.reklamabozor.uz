import axios from 'axios'

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unknown error'
  }

  if (!error.response) {
    return 'Cannot reach API. Is adspace_backend running on port 8000?'
  }

  const data = error.response.data as {
    message?: string
    errors?: Record<string, string[]>
  }

  if (data.errors) {
    const firstField = Object.keys(data.errors)[0]
    const firstMessage = firstField ? data.errors[firstField]?.[0] : null

    if (firstMessage) {
      return firstMessage
    }
  }

  if (data.message) {
    return data.message
  }

  return `Request failed with status ${error.response.status}`
}
