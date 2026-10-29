import type { ApiResponse } from '../types/api'

export async function requestData<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => null)

    let message = `Request failed: ${response.status}`

    if (
      typeof errorBody === 'object' &&
      errorBody !== null &&
      'message' in errorBody &&
      typeof errorBody.message === 'string'
    ) {
      message = errorBody.message
    }

    throw new Error(message)
  }

  const result: ApiResponse<T> = await response.json()

  return result.data
}
