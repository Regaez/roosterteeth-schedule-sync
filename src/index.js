require('dotenv').load();
const { getWeekSchedule } = require('./get-schedule');
const { createEvents } = require('./create-events');
const log = require('./logger');

getWeekSchedule()
  .then(createEvents)
  .then(data => log.info('Executed successfully.'))
  .catch(err => log.error({ message: 'Exception encountered!', error: err }));
