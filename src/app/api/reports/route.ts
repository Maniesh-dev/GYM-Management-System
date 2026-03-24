import { NextResponse } from 'next/server'

// Placeholder API route.
// If you add a real reports handler later, replace this with your logic.
export const GET = async () => {
  return NextResponse.json({ error: 'Reports endpoint not implemented' }, { status: 501 })
}
