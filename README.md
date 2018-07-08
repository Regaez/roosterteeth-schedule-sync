# Roosterteeth Schedule Sync

A small application that creates Google Calendar events for the Roosterteeth schedule.

## Installation

You need to have [Node v8.11.3](https://nodejs.org) installed in order to run the application. Once you have Node, open a terminal in the project directory and simply run `npm i` to install the dependencies.

### Configuration

There are 2 requirements for the app to work: environment variables and google authentication credentials.

The easiest way to add the environment variables is by creating a `.env` file in the project root and adding the following:

```
RT_API_URL=<<api url>>
RT_EPISODE_URL=https://roosterteeth.com/episode
CALENDAR_ALL=<<google calendar id>>
CALENDAR_RT=<<google calendar id>>
CALENDAR_AH=<<google calendar id>>
CALENDAR_FH=<<google calendar id>>
CALENDAR_TK=<<google calendar id>>
CALENDAR_GA=<<google calendar id>>
CALENDAR_CC=<<google calendar id>>
CALENDAR_SP7=<<google calendar id>>
CALENDAR_SA=<<google calendar id>>
CALENDAR_JT=<<google calendar id>>
```
For each calendar variable you'll need to provide a valid Google Calendar ID. You'll need to create a set of calendars in your Google account: one "combo" calendar for all events, and then nine individual calendars for each channel. You can retrieve the calendar ID from the "settings" section in the Google calendar web client. It should look something like: `9kf4ih1nrehhm6ias04sdfdp7g@group.calendar.google.com`

You'll also need to log into the [Google API Console](https://console.developers.google.com/) and create a new project and service. Then you'll need to create service-to-service credentials and store them in a `credentials.json` file in the project root. This will be used to authenticate with the Google Calendar API. The credentials JSON should look something like this:

```json
{
  "type": "service_account",
  "project_id": "<<REDACTED>>",
  "private_key_id": "<<REDACTED>>",
  "private_key": "<<REDACTED>>",
  "client_email": "<<REDACTED>>",
  "client_id": "<<REDACTED>>",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "<<REDACTED>>"
}
```

Once you've created the service, you'll need to add the `client_email` address to each of the new calendars' share settings and give it write access, otherwise the service account won't have permission to add events.

## Syncing the schedule

Once you have the dependencies installed and the application configured, you can simply run `npm run start` to execute the application.

By default, the application will check the schedule for the previous day and the upcoming week. This is so, if running daily, it can backfill any events that were added in the past after it last executed.
