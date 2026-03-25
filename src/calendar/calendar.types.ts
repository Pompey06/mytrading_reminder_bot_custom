export interface RawCalendarEvent {
  id?: string | number;
  title?: string;
  event?: string;
  name?: string;
  country?: string;
  impact?: string;
  date?: string;
  datetime?: string;
  dateUtc?: string;
  forecast?: string | null;
  previous?: string | null;
  [key: string]: unknown;
}

export interface ParsedCalendarEvent {
  externalId: string;
  title: string;
  country: string;
  impact: string;
  dateUtc: Date;
  forecast?: string | null;
  previous?: string | null;
  rawData: string;
  isSelected: boolean;
}
