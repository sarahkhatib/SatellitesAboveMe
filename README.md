This is a web-based application that allows users to track satellites above their current geographic location in real-time. The application leverages the N2YO satellite API to fetch satellite data based on the user's latitude, longitude, and altitude. Users can visualize the location of satellites on an interactive map using the Leaflet.js library. Hovering over the icons will provide some information about them.

Click the refresh button to see the 10 closest satellites to you!
& make sure you allow the site to use your location for it to work :)

Key Features:
1. Geolocation-based tracking: Automatically detects the user’s location using the browser’s Geolocation API and retrieves satellite data within a defined radius.
2. Interactive Map: Displays the user’s location and the nearest satellites on a real-time map with satellite markers.
3. Satellite Information: Provides detailed information about each satellite, including name, latitude, longitude, altitude, and the distance from the user.
4. Distance Calculation: Calculates the 3D distance between the user and satellites using the Haversine formula and highlights the closest one by pointing to it with a green line.
Responsive Design: Adapts to different screen sizes for an optimized user experience across devices.

Currently this project is hosted only in the client-side, but I do have a version where the API is called from the backend and the data is stored in Mongoose.

TO RUN THIS:

1. Download the repository
2. Create your own N2YO API key here: https://www.n2yo.com/api/
3. Create a .env file in the repository's root folder with the following variable: VITE_N2YO_API_KEY=<YOUR_API_KEY>
4. Install dependencies using npm install <library>
5. Run the following command on your terminal: netlify dev

Here is a working sample of this: https://satellitesaboveme.netlify.app/
