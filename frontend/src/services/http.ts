import type { ApiResponse } from '../types/api'

export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
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

  return response.json()
}

export async function requestData<T>(url: string, options?: RequestInit): Promise<T> {
  const result = await requestJson<ApiResponse<T>>(url, options)

  return result.data
}
