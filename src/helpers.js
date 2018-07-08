const crypto = require('crypto');
const moment = require('moment');

const getChannelName = (slug = "") => {
  return slug
    .toLowerCase()
    .replace(/(?:^|[\s-/])\w/g, (match) => {
      return match.toUpperCase();
    })
    .replace(/[-]/g, ' ');
};

const getCalendarId = (slug = "") => {
  switch (slug) {
    case "rooster-teeth":
      return process.env.CALENDAR_RT;
    case "achievement-hunter":
      return process.env.CALENDAR_AH;
    case "funhaus":
      return process.env.CALENDAR_FH;
    case "screwattack":
      return process.env.CALENDAR_SA;
    case "cow-chop":
      return process.env.CALENDAR_CC;
    case "sugar-pine-7":
      return process.env.CALENDAR_SP7;
    case "game-attack":
      return process.env.CALENDAR_GA;
    case "the-know":
      return process.env.CALENDAR_TK;
    case "jt-music":
      return process.env.CALENDAR_JT;
    default:
      return process.env.CALENDAR_ALL;
  }
};

const formatDescription = ({ show_title, display_title, channel_slug, slug, description, length }) => {
  const duration = moment.duration(length, 'seconds').humanize();

  return `${getChannelName(channel_slug)}${show_title ? ": " + show_title : ''}\n${display_title}\nDuration: ${duration}\n\n${description}\n\nWatch video: ${process.env.RT_EPISODE_URL}/${slug}`;
}

const getId = (uuid, sponsor = false) => {
  const id = sponsor ? uuid + 'sponsor' : uuid;
  return crypto.createHash('md5').update(id).digest('hex');
}

const defaultEventData = ({ uuid, attributes }, isSponsor) => {
  return {
    id: getId(uuid, isSponsor),
    summary: `${isSponsor?'FIRST: ':''}${attributes.show_title ? attributes.show_title + ' - ': ''}${attributes.title}`,
    description: formatDescription(attributes),
    transparency: 'transparent',
    guestsCanSeeOtherGuests: false
  }
}

const getEventTimes = (timestamp, length) => {
  const start = moment(timestamp);
  const end = moment(timestamp).seconds(length);

  return {
    start: {
      dateTime: start.toISOString()
    },
    end: {
      dateTime: end.toISOString()
    }
  };
};

module.exports = {
  defaultEventData,
  formatDescription,
  getChannelName,
  getCalendarId,
  getEventTimes,
  getId
}
