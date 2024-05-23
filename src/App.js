import React, { useState, useEffect } from 'react';
import './App.css';
import withSplashScreen from './components/withSplashScreen';

const App = () => {
  const [flightData, setFlightData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [flightCode, setFlightCode] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  const [authToken, setAuthToken] = useState(null);
  const weatherApiKey = 'a77060cec8bd4804a41230753242205';

  useEffect(() => {
    const fetchAuthToken = async () => {
      try {
        const clientID = 'jKU00xtST3hgjC1ThGxDosF79G8Jozb6';
        const clientSecret = 'ycnd8YKtLcLNU7YG';

        const amadeusTokenResponse = await fetch(
          'https://test.api.amadeus.com/v1/security/oauth2/token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=client_credentials&client_id=${clientID}&client_secret=${clientSecret}`,
          }
        );

        if (amadeusTokenResponse.ok) {
          const jsonAmadeusTokenResponse = await amadeusTokenResponse.json();
          setAuthToken(jsonAmadeusTokenResponse.access_token);
        } else {
          console.error('Failed to fetch Amadeus token');
        }
      } catch (error) {
        console.error('Error fetching Amadeus token:', error);
      }
    };

    fetchAuthToken();
  }, []);

  const getFlight = async () => {
    try {
      const flightResponse = await fetch(
        `https://test.api.amadeus.com/v2/schedule/flights?carrierCode=${flightCode.toUpperCase()}&flightNumber=${flightNumber}&scheduledDepartureDate=${departureDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (flightResponse.ok) {
        const jsonData = await flightResponse.json();
        if (jsonData.data && jsonData.data.length > 0) {
          const flight = jsonData.data[0];
          const departureAirport = flight.flightPoints.find(point => point.departure);
          const arrivalAirport = flight.flightPoints.find(point => point.arrival);
          const departureTime = departureAirport.departure.timings[0].value;
          const arrivalTime = arrivalAirport.arrival.timings[0].value;
          const airlineCode = flight.flightDesignator.carrierCode;

          setFlightData({
            departureAirport: departureAirport.iataCode,
            departureTime,
            arrivalAirport: arrivalAirport.iataCode,
            arrivalTime,
            airlineLogo: `https://pics.avs.io/200/200/${airlineCode}.png`
          });

          // Fetch weather data for departure airport
          getWeather(arrivalAirport.iataCode);
        } else {
          console.error('No flight data found');
        }
      } else {
        console.error('Failed to fetch flight data');
      }
    } catch (error) {
      console.error('Error fetching flight data:', error);
    }
  };

  const getWeather = async (airportCode) => {
    try {
      const weatherResponse = await fetch(`https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${airportCode}`);
      if (weatherResponse.ok) {
        const weatherJsonData = await weatherResponse.json();
        setWeatherData(weatherJsonData);
      } else {
        console.error('Failed to fetch weather data');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  return (
    <div className='App'>
      
      <div className='inputs'>
      <input
        className='iataInput'
        type="text"
        value={flightCode}
        onChange={(e) => setFlightCode(e.target.value)}
        placeholder="IATA, e.g. TK"
      />

      <input
        className='codeInput'
        type="text"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
        placeholder="Flight number, e.g. 164"
      />
      <input
        type="date"
        className='dateInput'
        value={departureDate}
        onChange={(e) => setDepartureDate(e.target.value)}
        placeholder="Departure date"
      />
      <button className='submitButton' onClick={getFlight}>Get Flight Details</button>
      </div>
      {flightData && (
        <div className='flightData'>
          <img src={flightData.airlineLogo} alt="Airline Logo" />
          <p>Departure Airport:</p> <h2>{flightData.departureAirport}</h2>
          Departure Time: <h2>{flightData.departureTime}</h2>
          Arrival Airport: <h2>{flightData.arrivalAirport}</h2>
          Arrival Time: <h2>{flightData.arrivalTime}</h2>
        </div>
      )}

      {weatherData && (
        <div>
          <h2>Weather at {flightData.arrivalAirport}</h2>
          <p>Temperature: {weatherData.current.temp_c}°C</p>
          <p>Condition: {weatherData.current.condition.text}</p>
        </div>
      )}
    </div>
  );
};

export default withSplashScreen(App);  
