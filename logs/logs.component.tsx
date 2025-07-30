import React from "npm:react";
import { Box, Text, Static, Spacer } from "npm:ink";
import { ProgressBar, ThemeProvider } from "@inkjs/ui";
import { theme } from "./logs.theme.ts";
import { setupDates } from "./logs.utils.tsx";

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

export function Logs(props: LogsProps) {
  const { date, eventsCount, logs, start, end } = props;

  // 🏗️ Setup
  const {
    dateLabel,
    dateProgressLabel,
    dateProgressPercent,
    daysTotal,
    daysRemaining,
    endLabel,
    startLabel,
  } = setupDates({ date, start, end });

  // 🎨 Markup
  const renderLog = (log: Log) => {
    const key = log.timestamp.toISOString() + log.value;
    return <Text key={key}>{log.value}</Text>;
  };

  return (
    <ThemeProvider theme={theme}>
      <Static items={logs}>{renderLog}</Static>
      <Box flexDirection="column" borderStyle="round" paddingY={1} paddingX={2}>
        <Box marginBottom={1}>
          <Text>Events count: {eventsCount}</Text>
        </Box>
        <Box>
          <Text>
            Processing {dateLabel}, {daysRemaining} days remaining
          </Text>
        </Box>
        <Box>
          <Text>{dateProgressLabel} </Text>
          <ProgressBar value={dateProgressPercent} />
        </Box>
        <Box>
          <Text>Start: {startLabel}</Text>
          <Spacer />
          <Text>Total: {daysTotal} days</Text>
          <Spacer />
          <Text>End: {endLabel}</Text>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
