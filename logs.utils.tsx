import React from "npm:react";
import {
  render,
  Box,
  Text,
  type RenderOptions,
  Static,
  TextProps,
} from "npm:ink";
import moment from "npm:moment-timezone";
import {
  defaultTheme,
  extendTheme,
  ProgressBar,
  ThemeProvider,
} from "@inkjs/ui";

const theme = extendTheme(defaultTheme, {
  components: {
    ProgressBar: {
      styles: {
        completed: (): TextProps => ({
          color: "white",
        }),
        remaining: (): TextProps => ({
          dimColor: true,
        }),
      },
    },
  },
});

interface Log {
  timestamp: Date;
  value: string;
}

interface LogsProps {
  date?: Date;
  eventsCount: number;
  logs: Log[];
  start?: Date;
  end?: Date;
}

function Logs(props: LogsProps) {
  const { date, eventsCount, logs, start, end } = props;

  // 🏗️ Setup
  const dateLabel = moment(date).format("YYYY-MM-DD");
  const startLabel = moment(start).format("YYYY-MM-DD");
  const endLabel = moment(end).format("YYYY-MM-DD");
  const dateProgress =
    (moment(date).diff(moment(start), "days") /
      moment(end).diff(moment(start), "days")) *
    100;

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
            Current Date: {dateLabel} - Start: {startLabel}, End: {endLabel}
          </Text>
        </Box>

        <Box>
          <Text>{dateProgress.toFixed(2)}% </Text>
          <ProgressBar value={dateProgress} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

const logsProps: LogsProps = {
  eventsCount: 0,
  logs: [],
};

const options: RenderOptions = { exitOnCtrlC: true };

const { rerender, clear } = render(<Logs {...logsProps} />, options);

export function clearConsole() {
  clear();
}

export function print(...logs: string[]) {
  logsProps.logs = logsProps.logs.concat(
    logs.map((log) => ({ timestamp: new Date(), value: log }))
  );
  rerender(<Logs {...logsProps} />);
}

export function setDates(
  args: Partial<Pick<LogsProps, "date" | "end" | "start">>
) {
  if (args.date) logsProps.date = args.date;
  if (args.start) logsProps.start = args.start;
  if (args.end) logsProps.end = args.end;
  rerender(<Logs {...logsProps} />);
}

export function incrementEventsCount() {
  logsProps.eventsCount += 1;
  rerender(<Logs {...logsProps} />);
}
