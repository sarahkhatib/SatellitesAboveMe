// netlify/functions/getSatellites.js
const axios = require('axios');

exports.handler = async (event) => {
  console.log('Function started');
  try {
    const { observerLatitude, observerLongitude, observerAltitude } = JSON.parse(event.body);
    console.log('Parsed request body:', { observerLatitude, observerLongitude, observerAltitude });
    const API_KEY = process.env.VITE_N2YO_API_KEY;
    const searchRadius = 90;
    const apiUrl = `https://api.n2yo.com/rest/v1/satellite/above/${observerLatitude}/${observerLongitude}/${observerAltitude || 0}/${searchRadius}/52/&apiKey=${API_KEY}`;

    const response = await axios.get(apiUrl);
    
    // Ensure response data is valid
    if (response.data && response.data.above) {
      return {
        statusCode: 200,
        body: JSON.stringify(response.data.above)
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No data found' })
      };
    }
  } catch (error) {
    console.error('Error fetching satellite data:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
