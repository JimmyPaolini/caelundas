export interface Log {
  timestamp: Date;
  value: string;
}

export interface LogsProps {
  date?: Date;
  eventsCount: number;
  logs: Log[];
  start?: Date;
  end?: Date;
}
