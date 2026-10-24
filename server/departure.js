// checks all student's saved classes, finds which one starts next, then subtracts walking time and buffer
// limitation: assumes classes repeat every week
// stretch feature can involve adding term dates, holidays, and exceptions
const { DateTime } = require("luxon");

const ZONE = "America/Los_Angeles";

const weekdays = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

function calculateNextDeparture(classes, walkMinutes, bufferMinutes = 5) {
  const now = DateTime.now().setZone(ZONE);

  const upcoming = [];

  for (const course of classes) {
    const weekday = weekdays[course.day];
    const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(
      course.start_time
    );

    if (!weekday || !match) continue;

    const hour = Number(match[1]);
    const minute = Number(match[2]);

    if (hour > 23 || minute > 59) continue;

    // Find this class's next occurrence within a week
    for (let offset = 0; offset <= 7; offset++) {
      const date = now.startOf("day").plus({
        days: offset
      });

      if (date.weekday !== weekday) continue;

      const classStart = date.set({
        hour,
        minute,
        second: 0,
        millisecond: 0
      });

      if (classStart <= now) continue;

      const leaveAt = classStart.minus({
        minutes: walkMinutes + bufferMinutes
      });

      upcoming.push({
        course: course.course,
        location: course.location,
        day: course.day,
        classStart,
        leaveAt
      });

      break;
    }
  }

  if (upcoming.length === 0) {
    return null;
  }

  upcoming.sort(
    (a, b) =>
      a.classStart.toMillis() - b.classStart.toMillis()
  );

  const next = upcoming[0];

  return {
    course: next.course,
    location: next.location,
    day: next.day,
    classStart: next.classStart.toISO(),
    leaveAt: next.leaveAt.toISO(),
    walkMinutes,
    bufferMinutes,
    minutesUntilDeparture: Math.max(
      0,
      Math.ceil(next.leaveAt.diff(now, "minutes").minutes)
    ),
    shouldLeaveNow: now >= next.leaveAt
  };
}

module.exports = { calculateNextDeparture };