const fetch = require('node-fetch');

const getLivestreams = () => {
  const url = `${process.env.RT_API_URL}/livestreams`;
  return fetch(url).then(res => res.json()).then(res => res.data);
};

module.exports = {
  getLivestreams
};
