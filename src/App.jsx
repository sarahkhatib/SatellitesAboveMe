import React, { useState, useEffect, useRef } from 'react';
import { ClipLoader } from 'react-spinners';
import axios from 'axios';
import L from 'leaflet';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { Container, Title, Text, List } from '@mantine/core';

function App() {

  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const [position, setPosition] = useState({
    observerLatitude: null,
    observerLongitude: null,
    observerAltitude: null,
  });
  const [satellites, setSatellites] = useState([]);

  // Function to get user's geo location
  const getLocation = (callback) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, altitude } = position.coords;
          setPosition({
            observerLatitude: latitude,
            observerLongitude: longitude,
            observerAltitude: altitude || 0,
          });
          if (callback) callback(); // Call the callback after setting the position
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  // Function to initialize the leaflet Map
  const initializeMap = (satellites) => {
    mapRef.current = L.map('map').setView([position.observerLatitude, position.observerLongitude], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapRef.current);
    updateMap(satellites);
  };

  // Function to update the Leaflet map
  const updateMap = (satellites) => {
    let observerMarker;

    if (mapRef.current) {
      // Clearing existing markers and polylines
      mapRef.current.eachLayer((layer) => {
        if ((layer instanceof L.Marker || layer instanceof L.Polyline) && layer !== observerMarker) {
          mapRef.current.removeLayer(layer);
        }
      });

      // custom icon for the observer marker
      const observerIcon = L.icon({
        iconUrl: 'observer.png', 
        iconSize: [70, 70], 
        iconAnchor: [12, 41],
        shadowUrl: markerShadow,
        shadowSize: [60, 60],
        shadowAnchor: [12, 41],
      });

      observerMarker = L.marker([position.observerLatitude, position.observerLongitude], { icon: observerIcon })
        .addTo(mapRef.current)
        .bindTooltip(`
          <b>This is You!</b> <br>
          <b>Latitude:</b> ${position.observerLatitude}<br>
          <b>Longitude:</b> ${position.observerLongitude}<br>
        `, { permanent: false, direction: 'left' }); // Set options for tooltip

      // custom icon for the satellites markers
      const customIcon = L.icon({
        iconUrl: 'satellite.png',
        shadowUrl: markerShadow,
        iconSize: [40, 40],
        shadowSize: [50, 50], 
        iconAnchor: [12, 41],
        shadowAnchor: [12, 41], 
        popupAnchor: [0, -41] 
      });

      // Add new markers for satellites
      satellites.forEach(satellite => {
        if (satellite.satlat && satellite.satlng) {
          L.marker([satellite.satlat, satellite.satlng], { icon: customIcon })
            .addTo(mapRef.current)
            .bindTooltip(`
              <b>Satellite:</b> ${satellite.satname}<br>
              <b>Latitude:</b> ${satellite.satlat}<br>
              <b>Longitude:</b> ${satellite.satlng}<br>
              <b>Altitude:</b> ${satellite.satalt}<br>
              <b>Distance From You:</b> ${satellite.distance} meters
            `, { permanent: false, direction: 'left' }); // Tooltip settings
        }
      });

      // marker for the closest satellite to the observer
      if (satellites.length > 0) {
        const closestSatellite = satellites[0];
        const closestSatelliteIcon = L.icon({
          iconUrl: 'satellite_close.png',
          iconSize: [40, 40], 
          iconAnchor: [12, 41], 
          shadowUrl: markerShadow,
          shadowSize: [50, 50], 
          shadowAnchor: [12, 41],
          popupAnchor: [0, -41]
        });
        L.marker([closestSatellite.satlat, closestSatellite.satlng], { icon: closestSatelliteIcon })
          .addTo(mapRef.current)
          .bindTooltip(`
            <b>Closest Satellite:</b> ${closestSatellite.satname}<br>
            <b>Latitude:</b> ${closestSatellite.satlat}<br>
            <b>Longitude:</b> ${closestSatellite.satlng}<br>
            <b>Altitude:</b> ${closestSatellite.satalt}<br>
            <b>Distance From You:</b> ${closestSatellite.distance} meters
          `, { permanent: false, direction: 'left' }); // Tooltip settings

        L.polyline([
          [position.observerLatitude, position.observerLongitude],
          [closestSatellite.satlat, closestSatellite.satlng]
        ], { color: 'green', weight: 10 }).addTo(mapRef.current);
      }
    }
  };


  useEffect(() => {
    getLocation();
    if (position.observerLatitude && position.observerLongitude) {
      if (!mapInitializedRef.current) {
        initializeMap([]);
        mapInitializedRef.current = true;
      } else {
        updateMap(satellites);
      }
    }

    // Function to handle window resize
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize(); // Force the map to recalculate its size
      }
    };

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };

  }, [position, satellites]);

  // Function to fetch satellite data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading

    getLocation(async () => {
      // Ensure the position is available
      if (!position.observerLatitude || !position.observerLongitude) {
        console.error('Observer location is not available');
        setLoading(false); // Stop loading
        return;
      }
      try {
        const response = await fetch('/.netlify/functions/getSatellites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            observerLatitude: position.observerLatitude,
            observerLongitude: position.observerLongitude,
            observerAltitude: position.observerAltitude,
          }),
        });
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const satellitesData = data.map(satellite => ({
            category: satellite.category || 'Unknown',
            satid: satellite.satid,
            satname: satellite.satname,
            satlat: satellite.satlat,
            satlng: satellite.satlng,
            satalt: satellite.satalt,
            distance: distance(position.observerLatitude, position.observerLongitude, position.observerAltitude || 0, satellite.satlat, satellite.satlng, satellite.satalt),
          }));

          // Sort satellites by distance
          satellitesData.sort((a, b) => a.distance - b.distance);

          // Set the closest 10 satellites to state
          setSatellites(satellitesData.slice(0, 10));
        } else {
          console.error('Invalid response from N2YO API', data);
        }
      } catch (error) {
        console.error('Error fetching satellite data:', error);
      } finally {
        setLoading(false); // Stop loading
      }
    });
  };

  // Function to calculate distance between two points using Haversine formula
  function distance(lat1, lon1, alt1, lat2, lon2, alt2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const dAlt = alt2 - alt1;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // distance in km
    const distance2D = R * c;

    // 3D distance (including altitude difference)
    const distance3D = Math.sqrt(distance2D ** 2 + dAlt ** 2);

    return Math.ceil(distance3D);
  }

  return (
  <div>
    <header className="header">
     <Title order={1}>Satellites Above Me</Title>
    </header>
    <div className="main-content">
      <div className="sections-container">
        <section className="section-1">
          <form onSubmit={handleSubmit}>
            <button className="custom-button" type="submit">Refresh</button>
          </form>
          <div style={{width: '1000px', height: '500px', display:'inline-flex'}}>
            {loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 9999
              }}>
                <ClipLoader size={150} color={"#123abc"} loading={loading} />
              </div>
            )}
            <div id="map"></div>
          </div>
        </section>
      </div>
      <div className="sections-container">
        <section className="section-2">
            <Title align="left" order={2}>About this Project</Title>
            <br></br>
            <Text align="left" size="xl">
              This is a web-based application that allows users to 
              track satellites above their current geographic location in real-time. 
              The application leverages the N2YO satellite API to fetch 
              satellite data based on the user's latitude, longitude, and altitude. 
              Users can visualize the location of satellites on an interactive map 
              using the Leaflet.js library. Hovering over the icons will provide some information about them.
              <br></br>
              <br></br>
              Click the refresh button to see the 10 closest satellites to you!
            </Text>
            <Text align="left" size="xl"><br></br>
              Key Features:
            </Text>
            <List align="left" size="xl">
              <List.Item>Geolocation-based tracking: Automatically detects the user’s location using the browser’s Geolocation API and retrieves satellite data within a defined radius.</List.Item>
              <List.Item>Interactive Map: Displays the user’s location and the nearest satellites on a real-time map with satellite markers.</List.Item>
              <List.Item>Satellite Information: Provides detailed information about each satellite, including name, latitude, longitude, altitude, and the distance from the user.</List.Item>
              <List.Item>Distance Calculation: Calculates the 3D distance between the user and satellites using the Haversine formula and highlights the closest one by pointing to it with a green line.</List.Item>
              <List.Item>Responsive Design: Adapts to different screen sizes for an optimized user experience across devices.</List.Item>
            </List>
            <Text align="left" size="xl"><br></br>
              Currently this project is hosted only in the client-side, but I do have a version where the API is called from the backend and the data is stored in Mongoose.
            </Text>
            <Text align="left" size="xl"><br></br>
              If the satellites don't load, try again in a few seconds. Sometimes the API is overloaded.
            </Text>
        </section>
      </div>
    </div>
    <footer className="footer">
      <Container>
        <Text align="center" size="sm">
          &copy; {new Date().getFullYear()} SARAH KHATIB. All rights reserved.
        </Text>
      </Container>
    </footer>
  </div>
  )
}

export default App;