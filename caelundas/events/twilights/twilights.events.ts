import _ from "npm:lodash";
import moment from "npm:moment-timezone";
import type { Moment } from "npm:moment";
import type { Event } from "../../calendar.utilities.ts";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types.ts";
import { getCalendar } from "../../calendar.utilities.ts";
import { upsertEvents } from "../../database.utilities.ts";
import {
  isAstronomicalDawn,
  isAstronomicalDusk,
  isCivilDawn,
  isCivilDusk,
  isNauticalDawn,
  isNauticalDusk,
} from "./twilights.utilities.ts";

export function getTwilightEvents(args: {
  currentMinute: Moment;
  sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
}) {
  const { currentMinute, sunAzimuthElevationEphemeris } = args;

  const twilightEvents: Event[] = [];

  const previousMinute = currentMinute.clone().subtract(1, "minutes");

  const { elevation: currentElevation } =
    sunAzimuthElevationEphemeris[currentMinute.toISOString()];
  const { elevation: previousElevation } =
    sunAzimuthElevationEphemeris[previousMinute.toISOString()];

  const elevations = { currentElevation, previousElevation };
  const date = currentMinute.toDate();

  if (isAstronomicalDawn({ ...elevations })) {
    twilightEvents.push(getAstronomicalDawnEvent(date));
  }
  if (isNauticalDawn({ ...elevations })) {
    twilightEvents.push(getNauticalDawnEvent(date));
  }
  if (isCivilDawn({ ...elevations })) {
    twilightEvents.push(getCivilDawnEvent(date));
  }
  if (isCivilDusk({ ...elevations })) {
    twilightEvents.push(getCivilDuskEvent(date));
  }
  if (isNauticalDusk({ ...elevations })) {
    twilightEvents.push(getNauticalDuskEvent(date));
  }
  if (isAstronomicalDusk({ ...elevations })) {
    twilightEvents.push(getAstronomicalDuskEvent(date));
  }

  return twilightEvents;
}

export function getAstronomicalDawnEvent(date: Date): Event {
  const description = "Astronomical Dawn";
  const summary = `🌠 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.debug(`${summary} at ${dateString}`);

  const astronomicalDawnEvent: Event = { start: date, summary, description };
  return astronomicalDawnEvent;
}

export function getNauticalDawnEvent(date: Date): Event {
  const description = "Nautical Dawn";
  const summary = `🌅 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.debug(`${summary} at ${dateString}`);

  const nauticalDawnEvent: Event = { start: date, summary, description };
  return nauticalDawnEvent;
}

export function getCivilDawnEvent(date: Date): Event {
  const description = "Civil Dawn";
  const summary = `🌄 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.debug(`${summary} at ${dateString}`);

  const civilDawnEvent: Event = { start: date, summary, description };
  return civilDawnEvent;
}

export function getCivilDuskEvent(date: Date): Event {
  const description = "Civil Dusk";
  const summary = `🌇 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.debug(`${summary} at ${dateString}`);

  const civilDuskEvent: Event = { start: date, summary, description };
  return civilDuskEvent;
}

export function getNauticalDuskEvent(date: Date): Event {
  const description = "Nautical Dusk";
  const summary = `🌉 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.debug(`${summary} at ${dateString}`);

  const nauticalDuskEvent: Event = { start: date, summary, description };
  return nauticalDuskEvent;
}

export function getAstronomicalDuskEvent(date: Date): Event {
  const description = "Astronomical Dusk";
  const summary = `🌌 ${description}`;

  const dateString = moment.tz(date, "America/New_York").toISOString(true);
  console.debug(`${summary} at ${dateString}`);

  const astronomicalDuskEvent: Event = { start: date, summary, description };
  return astronomicalDuskEvent;
}

export function writeTwilightEvents(args: {
  twilightEvents: Event[];
  start: Date;
  end: Date;
}) {
  const { twilightEvents, start, end } = args;
  if (_.isEmpty(twilightEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${twilightEvents.length} twilight events from ${timespan}`;
  console.log(`🌠 Writing ${message}`);

  upsertEvents(twilightEvents);

  const filename = `twilights_${timespan}`;
  const ingressCalendar = getCalendar(twilightEvents, "Twilights 🌠");
  Deno.writeFileSync(
    `./calendars/${filename}.ics`,
    new TextEncoder().encode(ingressCalendar)
  );

  console.log(`🌠 Wrote ${message}`);
}
