const { appendFileSync } = require('fs');
const moment = require('moment');

const error = (data) => {
  const logData = `${moment().format()} - ${JSON.stringify(data, null, 2)}\n---\n`;
  appendFileSync('./error.log', logData);
}

const info = (data, format = false) => {
  const logData = `${moment().format()} - ${format ? JSON.stringify(data, null, 2) : data}\n`;
  appendFileSync('./application.log', logData);
}

module.exports = {
  info,
  error
};
