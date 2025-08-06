import React from "npm:react";
import { Box, Text, Static, Spacer, Newline } from "npm:ink";
import { ProgressBar, Spinner, ThemeProvider } from "@inkjs/ui";
import { theme } from "./logs.theme.ts";
import { setupDates } from "./logs.utils.tsx";
import type { Log, LogsProps } from "./logs.types.tsx";

export function Logs(props: LogsProps) {
  const { date, eventsCount, logs, start, end } = props;

  // 🏗️ Setup
  const {
    dateLabel,
    dateProgressLabel,
    dateProgressPercent,
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
          <Text>
            📅 Count: {eventsCount} events
            <Newline />
            📆 Current: {dateLabel}
          </Text>
        </Box>
        <Box>
          <Spinner label={dateProgressLabel + " "} />
          <ProgressBar value={dateProgressPercent} />
        </Box>
        <Box>
          <Text>Start: {startLabel}</Text>
          <Spacer />
          <Text>End: {endLabel}</Text>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
