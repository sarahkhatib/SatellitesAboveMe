import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'; // Import React if needed
import App from './App.jsx'
import './index.css'
import { MantineProvider } from '@mantine/core';

createRoot(document.getElementById('root')).render(
  <MantineProvider 
      theme={{
        fontFamily: 'Josefin Sans, sans-serif',
      }}
  >
    <App />
  </MantineProvider>
)