export interface RecurrencePattern {
  type: 'weekly' | 'daily' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // For weekly recurrence (0-6)
  dayOfMonth?: number; // For monthly recurrence (1-31)
  endDate?: string; // ISO date string
}
