const crypto = require('crypto');
const moment = require('moment');
const { getClient } = require('./oauth');
const log = require('./logger');
let client;

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

const defaultEventData = ({ uuid, attributes }, sponsor = false) => {
  return {
    id: getId(uuid, sponsor),
    summary: `${sponsor?'FIRST: ':''} ${attributes.show_title} - ${attributes.title}`,
    description: formatDescription(attributes),
    transparency: 'transparent'
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

const eventExists = async (calendarId, eventId) => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`;
  try {
    const res = await client.request({ url });
    return res.status === 200;
  } catch (err) {
    return err.response.status === 200;
  }
}

const createEvent = async (item) => {
  let eventRequests = [];

  const channelUrl = `https://www.googleapis.com/calendar/v3/calendars/${getCalendarId(item.attributes.channel_slug)}/events`;
  const comboUrl = `https://www.googleapis.com/calendar/v3/calendars/${getCalendarId()}/events`;

  if (!item.attributes.is_sponsors_only) {

    const publicData = Object.assign({},
      defaultEventData(item, false),
      getEventTimes(item.attributes.public_golive_at, item.attributes.length)
    );

    const publicComboExists = await eventExists(
      getCalendarId(),
      getId(item.uuid)
    );

    if (!publicComboExists) {
      const publicCombo = client.request({
        method: 'POST',
        url: comboUrl,
        data: publicData
      })
      .then(() => log.info(
        `Created public combo event: ${item.attributes.title}; ${item.attributes.channel_slug}`
      ))
      .catch(err => log.error({
        message: 'Failed to create public combo event',
        episodeTitle: item.attributes.title,
        channel: item.attributes.channel_slug,
        data: publicData,
        error: err
      }));

      eventRequests.push(publicCombo);
    }

    const publicChannelExists = await eventExists(
      getCalendarId(item.attributes.channel_slug),
      getId(item.uuid)
    );

    if (!publicChannelExists) {
      const publicChannel = client.request({
        method: 'POST',
        url: channelUrl,
        data: publicData
      })
      .then(() => log.info(
        `Created public channel event: ${item.attributes.title}; ${item.attributes.channel_slug}`
      ))
      .catch(err => log.error({
        message: 'Failed to create public channel event',
        episodeTitle: item.attributes.title,
        channel: item.attributes.channel_slug,
        data: publicData,
        error: err
      }));

      eventRequests.push(publicChannel);
    }
  }

  if (item.attributes.sponsor_golive_at !== item.attributes.public_golive_at || item.attributes.is_sponsors_only) {
    const sponsorData = Object.assign({},
      defaultEventData(item, true),
      getEventTimes(item.attributes.sponsor_golive_at, item.attributes.length)
    );

    const sponsorComboExists = await eventExists(
      getCalendarId(),
      getId(item.uuid, true)
    );

    if (!sponsorComboExists) {
      const sponsorCombo = client.request({
        method: 'POST',
        url: comboUrl,
        data: sponsorData
      })
      .then(() => log.info(
        `Created sponsor combo event: ${item.attributes.title}; ${item.attributes.channel_slug}`
      ))
      .catch(err => log.error({
        message: 'Failed to create sponsor combo event',
        episodeTitle: item.attributes.title,
        channel: item.attributes.channel_slug,
        data: sponsorData,
        error: err
      }));

      eventRequests.push(sponsorCombo);
    }

    const sponsorChannelExists = await eventExists(
      getCalendarId(item.attributes.channel_slug),
      getId(item.uuid, true)
    );

    if (!sponsorChannelExists) {
      const sponsorChannel = client.request({
        method: 'POST',
        url: channelUrl,
        data: sponsorData
      })
      .then(() => log.info(
        `Created sponsor channel event: ${item.attributes.title}; ${item.attributes.channel_slug}`
      ))
      .catch(err => log.error({
        message: 'Failed to create sponsor channel event',
        episodeTitle: item.attributes.title,
        channel: item.attributes.channel_slug,
        data: sponsorData,
        error: err
      }));

      eventRequests.push(sponsorChannel);
    }
  }

  return Promise.all(eventRequests);
}

const createEvents = async (schedules) => {
  client = await getClient().catch(err => console.log(err));
  return Promise.all(schedules.map(createEvent));
}

module.exports = {
  createEvents
};
