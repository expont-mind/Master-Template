export interface StatItem {
  key: string;
  total: number;
  devices?: number;
}

export interface AnalyticsData {
  pageViews: StatItem[];
  visitors: StatItem[];
  topPages: StatItem[];
  topReferrers: StatItem[];
  countries: StatItem[];
  devices: StatItem[];
  browsers: StatItem[];
  totals: {
    pageViews: number;
    visitors: number;
  };
}

export type DateRange = "7" | "14" | "30";

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "7": "7 хоног",
  "14": "14 хоног",
  "30": "30 хоног",
};

export const COUNTRY_FLAGS: Record<string, string> = {
  MN: "MN",
  US: "US",
  KR: "KR",
  CN: "CN",
  JP: "JP",
  RU: "RU",
  DE: "DE",
  GB: "GB",
  FR: "FR",
  AU: "AU",
};

export const COUNTRY_NAMES: Record<string, string> = {
  MN: "Монгол",
  US: "АНУ",
  KR: "Өмнөд Солонгос",
  CN: "Хятад",
  JP: "Япон",
  RU: "Орос",
  DE: "Герман",
  GB: "Их Британи",
  FR: "Франц",
  AU: "Австрали",
};

export const DEVICE_LABELS: Record<string, string> = {
  mobile: "Гар утас",
  desktop: "Компьютер",
  tablet: "Таблет",
};

export const BROWSER_LABELS: Record<string, string> = {
  chrome: "Chrome",
  safari: "Safari",
  firefox: "Firefox",
  edge: "Edge",
  opera: "Opera",
};
