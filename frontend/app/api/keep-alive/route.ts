import { NextResponse } from 'next/server'
import { pingBackend } from '@/lib/keepAlive'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const isAlive = await pingBackend()
  return NextResponse.json({
    alive: isAlive,
    timestamp: new Date().toISOString(),
  })
}
