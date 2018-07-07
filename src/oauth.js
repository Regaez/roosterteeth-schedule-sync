const { auth } = require('google-auth-library');
const keys = require('../credentials.json');

const getClient = async () => {
  const client = auth.fromJSON(keys);
  client.scopes = ['https://www.googleapis.com/auth/calendar'];
  await client.authorize();
  return client;
}

module.exports = {
  getClient
};
