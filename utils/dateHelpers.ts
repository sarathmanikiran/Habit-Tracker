import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export const getDaysInMonth = (date: dayjs.Dayjs) => {
  const start = date.startOf('month');
  const end = date.endOf('month');
  const days = [];
  
  let curr = start;
  while (curr.isBefore(end) || curr.isSame(end, 'day')) {
    days.push(curr);
    curr = curr.add(1, 'day');
  }
  return days;
};

export const formatDate = (date: dayjs.Dayjs) => date.format('YYYY-MM-DD');

export const isToday = (dateStr: string) => dateStr === dayjs().format('YYYY-MM-DD');

export const getMonthRange = (date: dayjs.Dayjs) => ({
  start: date.startOf('month').format('YYYY-MM-DD'),
  end: date.endOf('month').format('YYYY-MM-DD'),
});