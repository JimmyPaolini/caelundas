import React from "npm:react";
import { render, RenderOptions } from "npm:ink";
import { Logs, type LogsProps } from "./logs.component.tsx";

const logsProps: LogsProps = { eventsCount: 0, logs: [] };

const options: RenderOptions = { exitOnCtrlC: true };

const { rerender, clear } = render(<Logs {...logsProps} />, options);

export function clearConsole() {
  clear();
}

export function print(...logs: string[]) {
  const toLog = (log: string) => ({ timestamp: new Date(), value: log });
  logsProps.logs = logsProps.logs.concat(logs.map(toLog));
  rerender(<Logs {...logsProps} />);
}

export type SetDateArgs = Partial<Pick<LogsProps, "date" | "end" | "start">>;
export function setDates(args: SetDateArgs) {
  if (args.date) logsProps.date = args.date;
  if (args.start) logsProps.start = args.start;
  if (args.end) logsProps.end = args.end;
  rerender(<Logs {...logsProps} />);
}

export function incrementEventsCount() {
  logsProps.eventsCount += 1;
  rerender(<Logs {...logsProps} />);
}
