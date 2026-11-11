export const AVAILABILITY_DAYS = [
  { value: "MON", label: "Mon", fullName: "Monday" },
  { value: "TUE", label: "Tue", fullName: "Tuesday" },
  { value: "WED", label: "Wed", fullName: "Wednesday" },
  { value: "THU", label: "Thu", fullName: "Thursday" },
  { value: "FRI", label: "Fri", fullName: "Friday" },
  { value: "SAT", label: "Sat", fullName: "Saturday" },
  { value: "SUN", label: "Sun", fullName: "Sunday" },
];

const PERIOD_WINDOWS = {
  MORNING: [[300, 720]],
  AFTERNOON: [[720, 1020]],
  EVENING: [[1020, 1260]],
  NIGHT: [[1260, 1440], [0, 300]],
};
const PERIOD_LABELS = {
  MORNING: "morning",
  AFTERNOON: "afternoon",
  EVENING: "evening",
  NIGHT: "night",
};
const CADENCE_LABELS = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "every two weeks",
  MONTHLY: "monthly",
  OCCASIONAL: "occasional",
  FLEXIBLE: "flexible frequency",
};

function matches(text, expression) {
  return expression.test(text);
}

function parseClock(hourValue, minuteValue, meridiem) {
  let hour = Number(hourValue);
  const minute = Number(minuteValue || 0);
  if (minute > 59) return null;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour > 23 || (meridiem && hour > 12)) return null;
  return hour * 60 + minute;
}

function minuteWindowsForPeriod(periods) {
  return periods.flatMap((period) => PERIOD_WINDOWS[period] || []);
}

function addPeriodForTime(periods, minute) {
  const hour = Math.floor(minute / 60) % 24;
  if (hour >= 5 && hour < 12) periods.add("MORNING");
  else if (hour >= 12 && hour < 17) periods.add("AFTERNOON");
  else if (hour >= 17 && hour < 21) periods.add("EVENING");
  else periods.add("NIGHT");
}

function cadenceToMonthlyCount(count, cadence) {
  const occurrences = Number(count);
  if (!Number.isFinite(occurrences)) return null;
  if (cadence === "DAILY") return occurrences * 30;
  if (cadence === "WEEKLY") return occurrences * 4.3;
  if (cadence === "BIWEEKLY") return occurrences * 2.15;
  if (cadence === "MONTHLY") return occurrences;
  if (cadence === "OCCASIONAL") return occurrences * 0.5;
  return null;
}

/**
 * Turn common schedule text into day, time-window, and cadence values. Unknown
 * text stays unknown; the parser never guesses that it means a full day.
 */
export function parseAvailability(value) {
  const text = String(value || "").toLowerCase().replace(/[–—]/g, "-").trim();
  const days = new Set();
  const periods = new Set();
  const explicitWindows = [];
  let flexible = false;
  let frequencyFlexible = false;
  let frequencyCount = null;
  let frequency = null;
  let monthlyCount = null;
  let frequencyUnit = "MEETINGS";
  let fullDay = false;

  if (!text) return {
    days: [], periods: [], windows: [], explicitWindow: null, flexible,
    frequencyFlexible, frequencyCount, frequency, monthlyCount, frequencyUnit, fullDay,
  };

  if (matches(text, /\bweekdays?\b|\bworking days?\b|\bmon(?:day)?\s*(?:-|to)\s*fri(?:day)?\b/)) {
    ["MON", "TUE", "WED", "THU", "FRI"].forEach((day) => days.add(day));
  }
  if (matches(text, /\bweekends?\b/)) {
    ["SAT", "SUN"].forEach((day) => days.add(day));
  }
  for (const { value: day, fullName } of AVAILABILITY_DAYS) {
    if (matches(text, new RegExp(`\\b(?:${fullName}|${day.toLowerCase()})\\b`))) days.add(day);
  }

  frequencyFlexible = matches(text, /\bflexible frequency\b|\bfrequency flexible\b/);
  flexible = !frequencyFlexible && matches(text, /\bflexible\b|\banytime\b|\bany day\b|\bwhenever\b/);
  if (flexible || matches(text, /\bevery day\b|\bdaily\b/)) {
    AVAILABILITY_DAYS.forEach(({ value }) => days.add(value));
  }

  if (matches(text, /\bmornings?\b|\bearly morning\b|\bbefore noon\b|\ba\.?m\.?\b/)) periods.add("MORNING");
  if (matches(text, /\bafternoons?\b|\bmidday\b/)) periods.add("AFTERNOON");
  if (matches(text, /\bevenings?\b/)) periods.add("EVENING");
  if (matches(text, /\bnights?\b|\bovernight\b/)) periods.add("NIGHT");
  fullDay = matches(text, /\bfull[ -]?day\b|\ball[ -]?day\b/);
  if (fullDay || flexible || matches(text, /\bany time of day\b/)) {
    Object.keys(PERIOD_WINDOWS).forEach((period) => periods.add(period));
  }

  // Accept both clear 24-hour ranges (09:00-13:00) and spoken clock ranges
  // (9am-1pm). Exact windows are retained for precise compatibility scoring.
  const range = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to|until|through)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  let explicitWindow = null;
  if (range) {
    const start = parseClock(range[1], range[2], range[3]);
    const end = parseClock(range[4], range[5], range[6]);
    if (start !== null && end !== null && start !== end) {
      explicitWindow = { start, end: end < start ? end + 1440 : end };
      if (explicitWindow.end <= 1440) explicitWindows.push([start, explicitWindow.end]);
      else explicitWindows.push([start, 1440], [0, explicitWindow.end - 1440]);
      for (let minute = start; minute < explicitWindow.end; minute += 60) {
        addPeriodForTime(periods, minute % 1440);
      }
    }
  }

  let windows = explicitWindows.length ? explicitWindows : minuteWindowsForPeriod([...periods]);
  if (fullDay || (flexible && !explicitWindows.length)) windows = [[0, 1440]];

  const hours = text.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*(?:per|\/)\s*(day|week|month|(?:two|2)\s+weeks?)\b/);
  if (hours) {
    frequencyCount = Number(hours[1]);
    frequencyUnit = "HOURS";
    frequency = hours[2] === "day" ? "DAILY" : hours[2] === "week" ? "WEEKLY" : /^(?:two|2)\s+weeks?$/.test(hours[2]) ? "BIWEEKLY" : "MONTHLY";
    monthlyCount = cadenceToMonthlyCount(frequencyCount, frequency);
  }

  const biweeklySessions = text.match(/\b(\d+(?:\.\d+)?)\s*(?:meetings?|sessions?|times?)\s*(?:per|every)\s*(?:two|2)\s*weeks?\b/);
  if (!hours && biweeklySessions) {
    frequencyCount = Number(biweeklySessions[1]);
    frequency = "BIWEEKLY";
    monthlyCount = cadenceToMonthlyCount(frequencyCount, frequency);
  }

  const sessions = text.match(/\b(\d+(?:\.\d+)?)\s*(?:meetings?|sessions?|times?)\s*(?:per|a|\/)\s*(day|week|month)\b/);
  if (!hours && !biweeklySessions && sessions) {
    frequencyCount = Number(sessions[1]);
    frequency = sessions[2] === "day" ? "DAILY" : sessions[2] === "week" ? "WEEKLY" : "MONTHLY";
    monthlyCount = cadenceToMonthlyCount(frequencyCount, frequency);
  }

  if (matches(text, /\bbi[ -]?weekly\b|\bevery other week\b|\bfortnightly\b/)) {
    frequencyCount = 1;
    frequency = "BIWEEKLY";
    monthlyCount = 2.15;
  } else if (!frequency && matches(text, /\btwice weekly\b|\btwo times a week\b/)) {
    frequencyCount = 2;
    frequency = "WEEKLY";
    monthlyCount = 8.6;
  } else if (!frequency && matches(text, /\btwice monthly\b|\btwo times a month\b/)) {
    frequencyCount = 2;
    frequency = "MONTHLY";
    monthlyCount = 2;
  } else if (!frequency && matches(text, /\bonce monthly\b|\bonce a month\b|\bmonthly\b|\bevery month\b/)) {
    frequencyCount = 1;
    frequency = "MONTHLY";
    monthlyCount = 1;
  } else if (!frequency && matches(text, /\bweekly\b|\bevery week\b|\bonce a week\b/)) {
    frequencyCount = 1;
    frequency = "WEEKLY";
    monthlyCount = 4.3;
  } else if (!frequency && matches(text, /\boccasionally\b|\boccasional\b|\bsometimes\b/)) {
    frequencyCount = 1;
    frequency = "OCCASIONAL";
    monthlyCount = 0.5;
  } else if (!frequency && matches(text, /\bdaily\b|\bevery day\b/)) {
    frequencyCount = 1;
    frequency = "DAILY";
    monthlyCount = 30;
  } else if (frequencyFlexible) {
    frequency = "FLEXIBLE";
  }

  return {
    days: AVAILABILITY_DAYS.map(({ value }) => value).filter((day) => days.has(day)),
    periods: Object.keys(PERIOD_WINDOWS).filter((period) => periods.has(period)),
    windows,
    explicitWindow,
    flexible,
    frequencyFlexible,
    frequencyCount,
    frequency,
    monthlyCount,
    frequencyUnit,
    fullDay,
  };
}

function setOverlap(left, right) {
  if (!left.length || !right.length) return null;
  const rightSet = new Set(right);
  const intersection = left.filter((item) => rightSet.has(item)).length;
  return intersection / new Set([...left, ...right]).size;
}

function mergeWindows(windows) {
  const sorted = [...windows].sort((left, right) => left[0] - right[0]);
  return sorted.reduce((merged, current) => {
    const previous = merged.at(-1);
    if (previous && current[0] <= previous[1]) previous[1] = Math.max(previous[1], current[1]);
    else merged.push([...current]);
    return merged;
  }, []);
}

function windowOverlap(left, right) {
  if (!left.length || !right.length) return null;
  const mergedLeft = mergeWindows(left);
  const mergedRight = mergeWindows(right);
  const duration = (windows) => windows.reduce((sum, [start, end]) => sum + end - start, 0);
  let intersection = 0;
  for (const [leftStart, leftEnd] of mergedLeft) {
    for (const [rightStart, rightEnd] of mergedRight) {
      intersection += Math.max(0, Math.min(leftEnd, rightEnd) - Math.max(leftStart, rightStart));
    }
  }
  const union = duration(mergedLeft) + duration(mergedRight) - intersection;
  return union ? intersection / union : 0;
}

/** Numeric pair features consumed by the app and Colab models. */
export function availabilityPairFeatures(leftValue, rightValue) {
  const left = parseAvailability(leftValue);
  const right = parseAvailability(rightValue);
  const dayOverlap = left.flexible || right.flexible
    ? (left.days.length && right.days.length ? 1 : null)
    : setOverlap(left.days, right.days);
  const timeOverlap = left.flexible || right.flexible
    ? (left.windows.length && right.windows.length ? 1 : null)
    : windowOverlap(left.windows, right.windows);
  const comparableFrequency = left.monthlyCount !== null && right.monthlyCount !== null && left.frequencyUnit === right.frequencyUnit;
  const frequencyFit = comparableFrequency
    ? Math.min(left.monthlyCount, right.monthlyCount) / Math.max(left.monthlyCount, right.monthlyCount, 0.01)
    : left.frequencyFlexible || right.frequencyFlexible
      ? 1
      : 0;

  return {
    availabilityDayOverlap: dayOverlap || 0,
    availabilityTimeOverlap: timeOverlap || 0,
    availabilityFrequencyFit: frequencyFit,
    availabilityPairKnown: Number(
      (dayOverlap !== null || timeOverlap !== null || comparableFrequency || left.frequencyFlexible || right.frequencyFlexible) &&
      (left.days.length || left.windows.length || left.monthlyCount !== null || left.frequencyFlexible || left.flexible) &&
      (right.days.length || right.windows.length || right.monthlyCount !== null || right.frequencyFlexible || right.flexible)
    ),
  };
}

export function availabilityDoesNotConflict(leftValue, rightValue) {
  const left = parseAvailability(leftValue);
  const right = parseAvailability(rightValue);
  const daysConflict = left.days.length > 0 && right.days.length > 0 && setOverlap(left.days, right.days) === 0;
  const timesConflict = left.windows.length > 0 && right.windows.length > 0 && windowOverlap(left.windows, right.windows) === 0;
  return !daysConflict && !timesConflict;
}

function formatTime(minutes) {
  const hour = Math.floor(minutes / 60).toString().padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

export function createAvailabilityDraft(value) {
  const parsed = parseAvailability(value);
  const inferredWindow = parsed.explicitWindow || (parsed.windows.length === 1
    ? { start: parsed.windows[0][0], end: parsed.windows[0][1] }
    : null);
  return {
    days: parsed.days,
    startTime: inferredWindow && !parsed.fullDay && !parsed.flexible ? formatTime(inferredWindow.start) : "",
    endTime: inferredWindow && !parsed.fullDay && !parsed.flexible ? formatTime(inferredWindow.end % 1440) : "",
    fullDay: parsed.fullDay || parsed.flexible,
    cadence: parsed.frequency || "",
    sessions: parsed.frequencyCount || 1,
    frequencyUnit: parsed.frequencyUnit,
  };
}

export function buildAvailabilityText(draft) {
  const dayNames = AVAILABILITY_DAYS
    .filter(({ value }) => draft.days.includes(value))
    .map(({ fullName }) => fullName);
  const parts = [];
  if (dayNames.length) parts.push(dayNames.join(", "));
  if (draft.fullDay) parts.push("full day");
  else if (draft.startTime && draft.endTime) parts.push(`${draft.startTime}-${draft.endTime}`);

  if (draft.cadence === "FLEXIBLE") parts.push("flexible frequency");
  else if (draft.cadence === "OCCASIONAL") parts.push("occasional");
  else if (draft.cadence) {
    const units = { DAILY: "day", WEEKLY: "week", BIWEEKLY: "two weeks", MONTHLY: "month" };
    const cadence = draft.cadence;
    const count = Math.max(1, Number(draft.sessions) || 1);
    if (cadence === "BIWEEKLY" && count === 1) parts.push("every two weeks");
    else if (count === 1 && draft.frequencyUnit !== "HOURS") parts.push(CADENCE_LABELS[cadence]);
    else if (cadence === "BIWEEKLY") parts.push(`${count} ${draft.frequencyUnit === "HOURS" ? "hours" : "meetings"} per two weeks`);
    else parts.push(`${count} ${draft.frequencyUnit === "HOURS" ? "hours" : "meetings"} per ${units[cadence] || "month"}`);
  }
  return parts.join("; ");
}

export function describeAvailability(value) {
  const parsed = parseAvailability(value);
  const parts = [];
  if (parsed.days.length === AVAILABILITY_DAYS.length) parts.push("any day");
  else if (parsed.days.length === 5 && parsed.days.every((day) => ["MON", "TUE", "WED", "THU", "FRI"].includes(day))) parts.push("weekdays");
  else if (parsed.days.length === 2 && parsed.days.includes("SAT") && parsed.days.includes("SUN")) parts.push("weekends");
  else if (parsed.days.length) parts.push(parsed.days.map((day) => AVAILABILITY_DAYS.find((entry) => entry.value === day)?.fullName).join(", "));

  if (parsed.fullDay) parts.push("full day");
  else if (parsed.explicitWindow) parts.push(`${formatTime(parsed.explicitWindow.start)}–${formatTime(parsed.explicitWindow.end % 1440)}`);
  else if (parsed.periods.length) parts.push(parsed.periods.map((period) => PERIOD_LABELS[period]).join(", "));
  if (parsed.frequency) parts.push(CADENCE_LABELS[parsed.frequency]);
  if (parsed.flexible && !parts.some((part) => part.includes("flexible"))) parts.push("flexible schedule");
  return parts;
}
