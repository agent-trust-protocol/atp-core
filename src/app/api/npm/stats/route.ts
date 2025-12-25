import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour (NPM stats update less frequently)

interface NPMStats {
  downloads: number
  weeklyDownloads: number
  monthlyDownloads: number
}

export async function GET() {
  try {
    // Fetch NPM package stats
    const npmResponse = await fetch('https://api.npmjs.org/downloads/range/last-month/atp-sdk', {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!npmResponse.ok) {
      throw new Error(`NPM API error: ${npmResponse.status}`)
    }

    const npmData = await npmResponse.json()

    // Calculate total downloads from the range
    let totalDownloads = 0
    let weeklyDownloads = 0
    let monthlyDownloads = 0

    if (npmData.downloads && Array.isArray(npmData.downloads)) {
      monthlyDownloads = npmData.downloads.reduce((sum: number, day: { downloads: number }) => {
        return sum + (day.downloads || 0)
      }, 0)

      // Last 7 days for weekly
      const last7Days = npmData.downloads.slice(-7)
      weeklyDownloads = last7Days.reduce((sum: number, day: { downloads: number }) => {
        return sum + (day.downloads || 0)
      }, 0)

      // Total is monthly for now (can be enhanced with historical data)
      totalDownloads = monthlyDownloads
    }

    const stats: NPMStats = {
      downloads: totalDownloads,
      weeklyDownloads,
      monthlyDownloads
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching NPM stats:', error)
    // Return fallback data on error
    return NextResponse.json({
      downloads: 0,
      weeklyDownloads: 0,
      monthlyDownloads: 0
    })
  }
}

