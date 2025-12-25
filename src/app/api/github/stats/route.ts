import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes

interface GitHubStats {
  stars: number
  forks: number
  contributors: number
}

export async function GET() {
  try {
    // Fetch GitHub repository stats
    const repoResponse = await fetch('https://api.github.com/repos/agent-trust-protocol/core', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ATP-Website'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!repoResponse.ok) {
      throw new Error(`GitHub API error: ${repoResponse.status}`)
    }

    const repoData = await repoResponse.json()

    // Fetch contributors count (using a more reliable method)
    let contributors = 0
    try {
      // Try to get contributors from the repository stats
      // GitHub API doesn't provide direct contributor count, so we'll estimate
      // or fetch a reasonable sample
      const contributorsResponse = await fetch('https://api.github.com/repos/agent-trust-protocol/core/contributors?per_page=100&anon=true', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ATP-Website'
        },
        next: { revalidate: 300 }
      })

      if (contributorsResponse.ok) {
        const contributorsData = await contributorsResponse.json()
        if (Array.isArray(contributorsData)) {
          // If we got 100, there might be more - check Link header
          const linkHeader = contributorsResponse.headers.get('link')
          if (linkHeader && linkHeader.includes('rel="last"')) {
            const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/)
            if (lastPageMatch) {
              contributors = parseInt(lastPageMatch[1], 10) * 100
            } else {
              contributors = contributorsData.length
            }
          } else {
            contributors = contributorsData.length
          }
        }
      }
    } catch (error) {
      console.error('Error fetching contributors:', error)
      // Use a fallback estimate based on stars (rough heuristic)
      contributors = Math.max(1, Math.floor((repoData.stargazers_count || 0) / 50))
    }

    const stats: GitHubStats = {
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      contributors: contributors || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching GitHub stats:', error)
    // Return fallback data on error
    return NextResponse.json({
      stars: 0,
      forks: 0,
      contributors: 0
    })
  }
}

