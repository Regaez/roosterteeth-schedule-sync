require('dotenv').load();
const { getWeekSchedule } = require('./get-schedule');
const { getLivestreams } = require('./get-livestreams');
const { createEvents, createLivestreamEvents } = require('./create-events');
const log = require('./logger');

getWeekSchedule()
  .then(createEvents)
  .then(getLivestreams)
  .then(createLivestreamEvents)
  .then(data => log.info('Executed successfully.'))
  .catch(err => log.error({ message: 'Exception encountered!', error: err }));
