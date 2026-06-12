import { NextResponse } from "next/server";

import { log } from "@/lib/observability/log";

const VERCEL_API_BASE = "https://vercel.com/api/web-analytics";

interface VercelStatItem {
  key: string;
  total: number;
  devices?: number;
}

interface VercelStatsResponse {
  data: VercelStatItem[];
}

interface VercelTimeseriesResponse {
  data: {
    groups: {
      all: VercelStatItem[];
    };
  };
}

async function fetchVercelTimeseries(params: URLSearchParams): Promise<VercelStatItem[]> {
  const url = `${VERCEL_API_BASE}/timeseries?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.ANALYTICS_API_TOKEN}`,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    log.error("vercel_timeseries_api_error", {
      status: response.status,
      body: await response.text(),
    });
    return [];
  }

  const json: VercelTimeseriesResponse = await response.json();
  return json.data?.groups?.all || [];
}

async function fetchVercelStats(type: string, params: URLSearchParams): Promise<VercelStatItem[]> {
  const statsParams = new URLSearchParams(params);
  statsParams.append("type", type);

  const url = `${VERCEL_API_BASE}/stats?${statsParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.ANALYTICS_API_TOKEN}`,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    log.error("vercel_api_error", {
      type,
      status: response.status,
      body: await response.text(),
    });
    return [];
  }

  const data: VercelStatsResponse = await response.json();
  return data.data || [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const projectId = process.env.ANALYTICS_PROJECT_ID;
  const teamId = process.env.ANALYTICS_TEAM_ID;
  const token = process.env.ANALYTICS_API_TOKEN;

  if (!projectId) {
    return NextResponse.json({ error: "ANALYTICS_PROJECT_ID not configured" }, { status: 500 });
  }

  if (!token) {
    return NextResponse.json({ error: "ANALYTICS_API_TOKEN not configured" }, { status: 500 });
  }

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);

  const params = new URLSearchParams({
    projectId,
    from: from.toISOString(),
    to: now.toISOString(),
    environment: "production",
  });

  if (teamId) {
    params.append("teamId", teamId);
  }

  const listParams = new URLSearchParams(params);
  listParams.append("limit", "10");

  try {
    const [timeseries, topPages, topReferrers, countries, devices, browsers] = await Promise.all([
      fetchVercelTimeseries(params),
      fetchVercelStats("path", listParams),
      fetchVercelStats("referrer", listParams),
      fetchVercelStats("country", listParams),
      fetchVercelStats("device_type", listParams),
      fetchVercelStats("client_name", listParams),
    ]);

    // timeseries: total = pageViews, devices = unique visitors
    const totalPageViews = timeseries.reduce((sum, item) => sum + item.total, 0);
    const totalVisitors = timeseries.reduce((sum, item) => sum + (item.devices ?? 0), 0);

    // Map timeseries to pageViews and visitors arrays for the dashboard
    const pageViews = timeseries.map((item) => ({
      key: item.key,
      total: item.total,
    }));

    const visitors = timeseries.map((item) => ({
      key: item.key,
      total: item.devices ?? 0,
    }));

    return NextResponse.json({
      pageViews,
      visitors,
      topPages,
      topReferrers,
      countries,
      devices,
      browsers,
      totals: {
        pageViews: totalPageViews,
        visitors: totalVisitors,
      },
    });
  } catch (error) {
    log.error("analytics_api_error", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
