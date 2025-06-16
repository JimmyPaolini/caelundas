import moment from "npm:moment-timezone";
import _ from "npm:lodash";
import { Asteroid, Comet, Planet } from "../symbols.constants.ts";
import type {
  Coordinates,
  EphemeridesComparator,
  EphemerisComparator,
  CoordinateEphemeris,
} from "./ephemeris.types.ts";
import { commandIdByBody } from "./ephemeris.constants.ts";

export type EphemerisComparator = (args: {
  previousLongitude: number;
  currentLongitude: number;
  nextLongitude?: number;
}) => boolean;

export type EphemeridesComparator = (args: {
  previousLongitudeBody1: number;
  previousLongitudeBody2: number;
  currentLongitudeBody1: number;
  currentLongitudeBody2: number;
  nextLongitudeBody1: number;
  nextLongitudeBody2: number;
}) => boolean;

// #region getEphemerisUrl
function getEphemerisUrl(args: {
  body: Planet | Asteroid | Comet;
  start: Date;
  end: Date;
  stepSizeMinutes?: number;
  stepCount?: number;
}) {
  const { body, start, end, stepSizeMinutes, stepCount } = args;

  const url = new URL("https://ssd.jpl.nasa.gov/api/horizons.api");

  url.searchParams.append("format", "text");
  url.searchParams.append("MAKE_EPHEM", "YES");
  url.searchParams.append("EPHEM_TYPE", "OBSERVER");

  /**
   * @param 31 - the ecliptic longitude/latitude
   * @param 4 - apparent azimuth and elevation
   */
  url.searchParams.append("QUANTITIES", "31");

  /** @param 500 - earth */
  url.searchParams.append("CENTER", "500");

  const id = commandIdByBody[body];
  url.searchParams.append("COMMAND", String(id));
  url.searchParams.append("START_TIME", start.toISOString());
  url.searchParams.append("STOP_TIME", end.toISOString());
  url.searchParams.append(
    "STEP_SIZE",
    stepCount ? String(stepCount) : `${stepSizeMinutes}m`
  );

  return url;
}

// #region parseEphemeris
function parseEphemeris(text: string) {
  const ephemerisTable = text.split("$$SOE")[1].split("$$EOE")[0].trim();

  const ephemeris: CoordinateEphemeris = ephemerisTable
    .split("\n ")
    .reduce((ephemeris, ephemerisLine) => {
      const [dateString, longitudeString, latitudeString] =
        ephemerisLine.split(/\s{2,}/);

      const date = moment.utc(dateString, "YYYY-MMM-DD HH:mm").toDate();
      const latitude = Number(latitudeString);
      const longitude = Number(longitudeString);

      return { ...ephemeris, [date.toISOString()]: { latitude, longitude } };
    }, {} as CoordinateEphemeris);

  return ephemeris;
}

// #region getEphemeris

export async function getEphemeris(args: {
  body: Planet | Asteroid | Comet;
  start: Date;
  end: Date;
  stepSizeMinutes?: number;
  stepCount?: number;
}) {
  const { body, start, end, stepSizeMinutes, stepCount } = args;

  let message = `🔭 Fetching ephemeris for ${body} from ${start.toISOString()} to ${end.toISOString()}`;
  if (stepCount) message += ` with ${stepCount} steps`;
  else message += ` at step ${stepSizeMinutes} minutes`;

  // console.debug(`🔭 Fetching ${message}`);

  const url = getEphemerisUrl({ body, start, end, stepSizeMinutes, stepCount });
  // console.debug(`🌐 Ephemeris url:`, url.toString());
  const text = await fetch(url.toString()).then((res) => res.text());
  // console.debug(`🏁 Ephemeris response:`, text);
  const ephemeris = parseEphemeris(text);

  // console.debug(`🔭 Fetched ${message}\n`);

  return ephemeris;
}

// #region getLunarPhases

type LunarPhasesResponse = {
  apiversion: string;
  numseasons: number;
  phasedata: Array<{
    day: number;
    month: number;
    phase: "First Quarter" | "Full Moon" | "Last Quarter" | "New Moon";
    time: string;
    year: number;
  }>;
};

export async function getLunarPhases(args: {
  start: Date;
  end: Date;
  tz: string;
  dst: boolean;
}) {
  const { start, end, tz, dst } = args;

  const startYear = moment(start).year();
  const endYear = moment(end).year();
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  const seasons = await Promise.all(
    years.map(async (year) => {
      const url = new URL("https://aa.usno.navy.mil/api/moon/seasons");
      url.searchParams.append("year", String(year));
      url.searchParams.append("tz", tz);
      url.searchParams.append("dst", String(dst));

      const response = await fetch(url.toString());
      const json: LunarPhasesResponse = await response.json();

      const seasons = json.phasedata
        .map((phase) => {
          const { year, month, time, day } = phase;
          const [hour, minute] = time.split(":");
          return {
            phase: phase.phase,
            timestamp: moment({
              year,
              month: month - 1,
              day,
              hour,
              minute,
              milliseconds: 0,
            }).toDate(),
          };
        })
        .filter(({ timestamp }) =>
          moment(timestamp).isBetween(start, end, undefined, "[]")
        );

      return seasons;
    })
  );

  return seasons.flat();
}

// #region getSeasons

type SeasonsForYearResponse = {
  apiversion: string;
  data: Array<{
    day: number;
    month: number;
    phenom: string;
    time: string;
    year: number;
  }>;
};

export async function getSeasons(args: {
  start: Date;
  end: Date;
  tz: string;
  dst: boolean;
}) {
  const { start, end, tz, dst } = args;

  const startYear = moment(start).year();
  const endYear = moment(end).year();
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  const seasons = await Promise.all(
    years.map(async (year) => {
      const url = new URL("https://aa.usno.navy.mil/api/moon/seasons");
      url.searchParams.append("year", String(year));
      url.searchParams.append("tz", tz);
      url.searchParams.append("dst", String(dst));

      const response = await fetch(url.toString());
      const json: SeasonsForYearResponse = await response.json();

      const seasons = json.data
        .map((season) => {
          const { year, month, time, day, phenom } = season;
          const [hour, minute] = time.split(":");
          return {
            phenom,
            timestamp: moment({
              year,
              month: month - 1,
              day,
              hour,
              minute,
              milliseconds: 0,
            }).toDate(),
          };
        })
        .filter(({ timestamp }) =>
          moment(timestamp).isBetween(start, end, undefined, "[]")
        );

      return seasons;
    })
  );

  return seasons.flat();
}

// #region getDay

type DayResponse = {
  apiversion: string;
  geometry: { coordinates: [number, number]; type: string };
  fracillum: string;
  properties: {
    data: {
      moondata: Array<{ phen: string; time: string }>;
      sundata: Array<{ phen: string; time: string }>;
    };
  };
};

export async function getDay(args: {
  start: Date;
  end: Date;
  tz: string;
  dst?: boolean;
  coords: Coordinates;
}) {
  const { start, end, tz, dst = true, coords } = args;

  const dates = Array.from(
    { length: moment(end).diff(start, "days") + 1 },
    (_, i) => moment(start).add(i, "days").format("YYYY-MM-DD")
  );

  const days = [];
  for await (const date of dates) {
    const url = new URL("https://aa.usno.navy.mil/api/rstt/oneday");
    url.searchParams.append("date", date);
    url.searchParams.append("coords", coords.join(","));
    url.searchParams.append("tz", tz);
    url.searchParams.append("dst", String(dst));

    // console.debug(`🌐 Day url:`, url.toString());
    const response = await fetch(url.toString());
    const day: DayResponse = await response.json();
    // console.debug(`🏁 Day response:`, day);

    days.push(day);
  }

  return days;
}

// #region searchEphemeris

/**
 * @description Searches for the timestamp in an ephemeris that satisfies a
 * comparator, assuming that only one timestamp within the time range will match.
 */
export async function searchEphemeris(args: {
  body: Planet | Asteroid | Comet;
  start: Date;
  end: Date;
  comparator: EphemerisComparator;
}) {
  const { body, start, end, comparator } = args;

  const stepCount = 60;
  const difference = moment(end).diff(start);
  const margin = difference / stepCount;
  const ephemeris = await getEphemeris({
    body,
    start: moment(start).subtract(margin).toDate(),
    end: moment(end).add(margin).toDate(),
    stepCount: stepCount + 2,
  });

  const ephemerisEntries = Object.entries(ephemeris).toSorted(([a], [b]) =>
    moment(a).diff(moment(b))
  );

  const startLongitude = _.first(ephemerisEntries)?.[1].longitude;
  const endLongitude = _.last(ephemerisEntries)?.[1].longitude;
  const comparison = comparator({
    previousLongitude: startLongitude,
    currentLongitude: endLongitude,
  });
  if (!comparison) return null;

  for (const current of ephemerisEntries) {
    const index = ephemerisEntries.indexOf(current);
    if (index < 1 || index >= stepCount) continue;

    const previous = ephemerisEntries[index - 1];

    const comparison = comparator({
      previousLongitude: previous[1].longitude,
      currentLongitude: current[1].longitude,
    });
    if (comparison) {
      const difference = moment(current[0]).diff(previous[0], "minutes");
      if (difference <= 1) {
        return {
          timestamp: new Date(current[0]),
          longitude: current[1].longitude,
        };
      } else {
        return searchEphemeris({
          body,
          start: new Date(previous[0]),
          end: new Date(current[0]),
          comparator,
        });
      }
    }
  }

  // console.log(
  //   `🚫 No comparison successful for ${body} from ${start.toISOString()} to ${end.toISOString()}\n`
  // );

  return null;
}

// #region searchEphemerides

/**
 * @description Searches for the timestamp in ephemerides that satisfies a
 * comparator, assuming that only one timestamp within the time range will match.
 */
export async function searchEphemerides(args: {
  body1: Planet | Asteroid | Comet;
  body2: Planet | Asteroid | Comet;
  start: Date;
  end: Date;
  comparator: EphemeridesComparator;
}) {
  const { body1, body2, start, end, comparator } = args;

  const stepCount = 60;
  const difference = moment(end).diff(start);
  const margin = difference / stepCount;
  const ephemerisBody1 = await getEphemeris({
    body: body1,
    start: moment(start).subtract(margin).toDate(),
    end: moment(end).add(margin).toDate(),
    stepCount: stepCount + 2,
  });
  const ephemerisBody2 = await getEphemeris({
    body: body2,
    start: moment(start).subtract(margin).toDate(),
    end: moment(end).add(margin).toDate(),
    stepCount: stepCount + 2,
  });

  const timestamps = Object.keys(ephemerisBody1).toSorted();

  for (const currentTimestamp of timestamps) {
    const index = timestamps.indexOf(currentTimestamp);
    if (index < 1 || index >= stepCount) continue;

    const previousTimestamp = timestamps[index - 1];
    const nextTimestamp = timestamps[index + 1];

    const previousBody1 = ephemerisBody1[previousTimestamp];
    const previousBody2 = ephemerisBody2[previousTimestamp];
    const currentBody1 = ephemerisBody1[currentTimestamp];
    const currentBody2 = ephemerisBody2[currentTimestamp];
    const nextBody1 = ephemerisBody1[nextTimestamp];
    const nextBody2 = ephemerisBody2[nextTimestamp];

    // console.debug("📐 Searching ephemeris", {
    //   body1,
    //   body2,
    //   currentTimestamp,
    //   longitude1Body1: previousBody1.longitude,
    //   longitude1Body2: previousBody2.longitude,
    //   longitude2Body1: currentBody1.longitude,
    //   longitude2Body2: currentBody2.longitude,
    //   previousTimestamp,
    // });

    console.debug(`📐 Timestamp ${currentTimestamp}`);
    const comparison = comparator({
      previousLongitudeBody1: previousBody1.longitude,
      previousLongitudeBody2: previousBody2.longitude,
      currentLongitudeBody1: currentBody1.longitude,
      currentLongitudeBody2: currentBody2.longitude,
      nextLongitudeBody1: nextBody1.longitude,
      nextLongitudeBody2: nextBody2.longitude,
    });
    if (comparison) {
      const difference = moment(currentTimestamp).diff(
        previousTimestamp,
        "minutes"
      );

      if (difference <= 1) {
        return {
          timestamp: new Date(currentTimestamp),
          longitudeBody1: currentBody1.longitude,
          longitudeBody2: currentBody2.longitude,
        };
      } else {
        return searchEphemerides({
          body1,
          body2,
          start: new Date(previousTimestamp),
          end: new Date(currentTimestamp),
          comparator,
        });
      }
    }
  }

  // console.log(
  //   `🚫 No comparison successful for ${body1} and ${body2} from ${start.toISOString()} to ${end.toISOString()}\n`
  // );

  return null;
}
