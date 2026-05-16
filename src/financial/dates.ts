import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

type DateRange = { from: string; to: string };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DD_MM_RE = /^(\d{2})\/(\d{2})$/;

function fmt(date: Date, tz: string): string {
  return formatInTimeZone(date, tz, 'yyyy-MM-dd');
}

function single(date: Date, tz: string): DateRange {
  const s = fmt(date, tz);
  return { from: s, to: s };
}

export function resolveDateExpression(
  expression: string,
  referenceDate: Date,
  timezone: string,
): DateRange | null {
  const expr = expression.trim().toLowerCase();
  const zoned = toZonedTime(referenceDate, timezone);

  switch (expr) {
    case 'hoje':
      return single(referenceDate, timezone);

    case 'ontem':
      return single(addDays(zoned, -1), timezone);

    case 'anteontem':
      return single(addDays(zoned, -2), timezone);

    case 'amanhã':
    case 'amanha':
      return single(addDays(zoned, 1), timezone);

    case 'essa semana':
    case 'esta semana': {
      const from = startOfWeek(zoned, { weekStartsOn: 1 });
      const to = endOfWeek(zoned, { weekStartsOn: 1 });
      return { from: fmt(from, timezone), to: fmt(to, timezone) };
    }

    case 'esse mês':
    case 'este mês':
    case 'esse mes':
    case 'este mes': {
      const from = startOfMonth(zoned);
      const to = endOfMonth(zoned);
      return { from: fmt(from, timezone), to: fmt(to, timezone) };
    }

    default:
      break;
  }

  // ISO date: YYYY-MM-DD
  if (ISO_DATE_RE.test(expr)) {
    return { from: expr, to: expr };
  }

  // DD/MM — use reference year from the zoned perspective
  const ddMm = DD_MM_RE.exec(expr);
  if (ddMm) {
    const day = ddMm[1];
    const month = ddMm[2];
    const year = formatInTimeZone(referenceDate, timezone, 'yyyy');
    const iso = `${year}-${month}-${day}`;
    return { from: iso, to: iso };
  }

  return null;
}
