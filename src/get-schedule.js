const fetch = require('node-fetch');

const getSchedule = (from, to) => {
  const url = `${process.env.RT_API_URL}/schedule?from=${from.toISOString()}&to=${to.toISOString()}`;
  return fetch(url).then(res => res.json());
};

const getWeekSchedule = () => {
  // We can only make requests for one day at a time due to RT API restrictions
  const dailySchedules = [...Array(8)].map((item, i) => {
    const now = new Date();
    // we start one day in the past to catch any events that may have been published
    // after the application last ran, then check the upcoming week's schedule.
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i - 1)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);

    return getSchedule(start, end);
  });

  return Promise.all(dailySchedules)
    .then(schedules => {
      // flatten all our days into one array
      return schedules.reduce((output, day) => {
        return output.concat(day.data);
      }, []);
    });
}

module.exports = {
  getSchedule,
  getWeekSchedule
};
