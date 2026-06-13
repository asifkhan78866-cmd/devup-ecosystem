const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function pingBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    })
    return response.ok
  } catch {
    return false
  }
}
