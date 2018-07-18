const { getClient } = require('./oauth');
const {
  defaultEventData,
  formatDescription,
  getChannelName,
  getCalendarId,
  getEventTimes,
  defaultLivestreamEventData,
  getLivestreamEventTimes,
  getId
} = require('./helpers');
const log = require('./logger');
let client = undefined;

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

const defaultEventRequests = (channel) => {
  const channelUrl = `https://www.googleapis.com/calendar/v3/calendars/${getCalendarId(channel)}/events`;
  const generalUrl = `https://www.googleapis.com/calendar/v3/calendars/${getCalendarId()}/events`;

  return [
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
      url: channelUrl
    }
  ];
}

const createEvent = async (item) => {
  const {
    channel_slug,
    public_golive_at,
    length,
    is_sponsors_only,
    sponsor_golive_at
  } = item.attributes;

  // first we filter out any events that are not necessary to create
  let eventRequests = defaultEventRequests(channel_slug)
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
    const slug = event.calendarType === 'CHANNEL' ? channel_slug : '';
    const isSponsor = event.type === 'SPONSOR';
    return eventExists(getCalendarId(slug), getId(item.uuid, isSponsor))
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

const createLivestreamEvent = async (item) => {
  const {
    channel_slug,
    starts_at,
    is_sponsors_only,
    ends_at
  } = item.attributes;

  // first we filter out any events that are not necessary to create
  let eventRequests = defaultEventRequests(channel_slug)
    .filter(event => {
      // we don't need to create public events if they're sponsor-only
      if (event.type === 'PUBLIC' && is_sponsors_only) { return false; }

      // we don't need to create sponsor events if it's public
      if (event.type === 'SPONSOR' && !is_sponsors_only) { return false; }

      return true;
    });

  // we check if the events already exist in Google calendar
  const existingEvents = await Promise.all(eventRequests.map(event => {
    const slug = event.calendarType === 'CHANNEL' ? channel_slug : '';
    const isSponsor = event.type === 'SPONSOR';
    return eventExists(getCalendarId(slug), getId(item.uuid, isSponsor))
      .catch(error => log.error({ message: `Failed to check event exists.`, error }));
  }));

  eventRequests = eventRequests
    .filter((event, i) => {
      // we only create an event if it doesn't exist already
      return !existingEvents[i];
    })
    .map(event => {
      // we map the event types to actual Google calendar event insertion requests
      const isSponsor = event.type === 'SPONSOR';

      const eventData = Object.assign({},
        defaultLivestreamEventData(item, isSponsor),
        getLivestreamEventTimes(starts_at, ends_at)
      );

      return makeRequest({
        eventType: `${event.type}_${event.calendarType}`,
        data: eventData,
        url: event.url
      });
    });

  return Promise.all(eventRequests);
}

const createLivestreamEvents = async (livestreams) => {
  await initialiseClient();
  return Promise.all(livestreams.map(createLivestreamEvent));
};

const initialiseClient = async () => {
  if (typeof client === 'undefined') {
    client = await getClient().catch(error => log.error({ message: `Failed to get Google API client.`, error }));
  }
  return client;
};

const createEvents = async (schedules) => {
  await initialiseClient();
  return Promise.all(schedules.map(createEvent));
}

module.exports = {
  createEvents,
  createLivestreamEvents
};
