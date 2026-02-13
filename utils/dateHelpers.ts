import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export const getDaysInMonth = (date: dayjs.Dayjs) => {
  const daysInMonth = date.daysInMonth();
  const start = date.startOf('month');
  return Array.from({ length: daysInMonth }, (_, i) => start.add(i, 'day'));
};

export const formatDate = (date: dayjs.Dayjs) => date.format('YYYY-MM-DD');

export const isToday = (dateStr: string) => dateStr === dayjs().format('YYYY-MM-DD');

export const getMonthRange = (date: dayjs.Dayjs) => ({
  start: date.startOf('month').format('YYYY-MM-DD'),
  end: date.endOf('month').format('YYYY-MM-DD'),
});