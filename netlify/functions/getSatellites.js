// netlify/functions/getSatellites.js
const axios = require('axios');

exports.handler = async (event) => {
  const { observerLatitude, observerLongitude, observerAltitude } = JSON.parse(event.body);
  const API_KEY = process.env.VITE_N2YO_API_KEY;
  const searchRadius = 90;
  const apiUrl = `https://api.n2yo.com/rest/v1/satellite/above/${observerLatitude}/${observerLongitude}/${observerAltitude || 0}/${searchRadius}/0/&apiKey=${API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error fetching satellite data' }),
    };
  }
};
