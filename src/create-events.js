const { getClient } = require('./oauth');
const {
  defaultEventData,
  formatDescription,
  getChannelName,
  getCalendarId,
  getEventTimes,
  getId
} = require('./helpers');
const log = require('./logger');
let client;

const eventExists = async (calendarId, eventId) => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`;
  try {
    const res = await client.request({ url });
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

const makeRequest = ({ url, data, eventType }) => {
  return client.request({
    method: 'POST',
    url,
    data
  })
  .then(() => log.info(`Created ${eventType} event: ${data.summary}`))
  .catch(error => log.error({ message: `Failed to create ${eventType} event`, data, error }));
}

const createEvent = async (item) => {
  const {
    channel_slug,
    public_golive_at,
    length,
    is_sponsors_only,
    sponsor_golive_at
  } = item.attributes;

  const channelUrl = `https://www.googleapis.com/calendar/v3/calendars/${getCalendarId(channel_slug)}/events`;
  const generalUrl = `https://www.googleapis.com/calendar/v3/calendars/${getCalendarId()}/events`;

  let eventRequests = [
    {
      type: 'PUBLIC',
      calendarType: 'ALL',
      url: generalUrl
    },
    {
      type: 'PUBLIC',
      calendarType: 'CHANNEL',
      url: channelUrl
    },
    {
      type: 'SPONSOR',
      calendarType: 'ALL',
      url: generalUrl
    },
    {
      type: 'SPONSOR',
      calendarType: 'CHANNEL',
      url: generalUrl
    }
  ];

  // first we filter out any events that are not necessary to create
  eventRequests = eventRequests
    .filter(event => {
      // we don't need to create public events if they're sponsor-only
      if (event.type === 'PUBLIC' && is_sponsors_only) { return false; }

      // if the sponsor video goes live at the same time as public and isn't sponsor-only,
      // we can skip the sponsor event to avoid duplicates showing up in the calendar
      if (event.type === 'SPONSOR' && (sponsor_golive_at === public_golive_at && !is_sponsors_only)) { return false; }

      return true;
    });

  // we check if the events already exist in Google calendar
  const existingEvents = await Promise.all(eventRequests.map(event => {
    const slug = event.type === 'PUBLIC' ? channel_slug : '';
    return eventExists(getCalendarId(slug), getId(item.uuid))
      .catch(error => log.error({ message: `Failed to check event exists.`, error }));
  }));

  eventRequests = eventRequests
    .filter((event, i) => {
      // we only create an event if it doesn't exist already
      return !existingEvents[i];
    })
    .map(event => {
      // we map the event types to actual Google calendar event insertion requests
      const startTime = event.type === 'PUBLIC' ? public_golive_at : sponsor_golive_at;
      const isSponsor = event.type === 'SPONSOR';

      const eventData = Object.assign({},
        defaultEventData(item, isSponsor),
        getEventTimes(startTime, length)
      );

      return makeRequest({
        eventType: `${event.type}_${event.calendarType}`,
        data: eventData,
        url: event.url
      });
    });

  return Promise.all(eventRequests);
}

const createEvents = async (schedules) => {
  client = await getClient().catch(error => log.error({ message: `Failed to get Google API client.`, error }));
  return Promise.all(schedules.map(createEvent));
}

module.exports = {
  createEvents
};
