# Socket Usage Examples

This document provides practical examples for using the socket library in different scenarios.

## Basic Usage

### Setting Up and Connecting

```typescript
// Import the socket store
import useSocketStore from '@cloud/shared/socket/store/socket.store';
import { useEffect } from 'react';

function SocketConnection() {
  const { connect, disconnect, isConnected, error } = useSocketStore();

  useEffect(() => {
    // Set configuration
    useSocketStore.getState().setConfig({
      url: 'https://socket.example.com',
      path: '/socket.io',
      orgId: 'my-organization',
    });

    // Connect to the socket server
    connect()
      .then(() => {
        console.log('Socket connected successfully');
      })
      .catch((err) => {
        console.error('Socket connection failed:', err);
      });

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <div>
      Socket status: {isConnected ? 'Connected' : 'Disconnected'}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Basic Subscription

```typescript
import useSocketStore from '@cloud/shared/socket/store/socket.store';
import { useState, useEffect } from 'react';

function TemperatureMonitor() {
  const { subscribe, isConnected } = useSocketStore();
  const [temperature, setTemperature] = useState(null);

  useEffect(() => {
    if (!isConnected) return;

    // Simple subscription
    const unsubscribe = subscribe('temperature/sensor1', {
      callback: (data) => {
        setTemperature(data.value);
      },
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [isConnected, subscribe]);

  return <div>Current temperature: {temperature !== null ? `${temperature}°C` : 'Loading...'}</div>;
}
```

## Advanced Usage

### Using Throttling for High-Frequency Data

```typescript
import useSocketStore from '@cloud/shared/socket/store/socket.store';
import { useState, useEffect } from 'react';

function GPSTracker() {
  const { subscribe, isConnected } = useSocketStore();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!isConnected) return;

    // Subscription with throttling
    const unsubscribe = subscribe('gps/tracker1', {
      throttle: 1000, // Limit updates to once per second
      callback: (data) => {
        setPosition({
          latitude: data.lat,
          longitude: data.lng,
        });
      },
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [isConnected, subscribe]);

  return (
    <div>
      {position ? (
        <div>
          Latitude: {position.latitude.toFixed(6)}
          <br />
          Longitude: {position.longitude.toFixed(6)}
        </div>
      ) : (
        'Acquiring position...'
      )}
    </div>
  );
}
```

### Data Transformation

```typescript
import useSocketStore from '@cloud/shared/socket/store/socket.store';
import { useState, useEffect } from 'react';

function WeatherStation() {
  const { subscribe, isConnected } = useSocketStore();
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!isConnected) return;

    // Subscription with data transformation
    const unsubscribe = subscribe('weather/station1', {
      transform: (data) => ({
        temperature: data.temp_c, // Rename fields
        humidity: data.hum,
        windSpeed: data.wind * 3.6, // Convert m/s to km/h
        time: new Date(data.ts * 1000), // Convert timestamp
      }),
      callback: (transformedData) => {
        setWeather(transformedData);
      },
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [isConnected, subscribe]);

  if (!weather) return <div>Loading weather data...</div>;

  return (
    <div>
      <h3>Weather at {weather.time.toLocaleTimeString()}</h3>
      <div>Temperature: {weather.temperature}°C</div>
      <div>Humidity: {weather.humidity}%</div>
      <div>Wind Speed: {weather.windSpeed.toFixed(1)} km/h</div>
    </div>
  );
}
```

## Working with Device-Specific Topics

### Using the Topic Formatter

```typescript
import useSocketStore from '@cloud/shared/socket/store/socket.store';
import { formatDeviceTopic } from '@cloud/shared/socket/utils/topic-formatter';
import { TopicType } from '@cloud/shared/socket/enums/topic-types.enum';
import { useState, useEffect } from 'react';

function DronePositionTracker({ droneId }) {
  const { subscribe, isConnected } = useSocketStore();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!isConnected || !droneId) return;

    // Format the topic string using the formatter
    const topic = formatDeviceTopic(TopicType.Position, droneId);

    // Subscribe using the formatted topic
    const unsubscribe = subscribe(topic, {
      callback: (data) => {
        setPosition(data);
      },
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [droneId, isConnected, subscribe]);

  if (!position) return <div>Waiting for position data...</div>;

  return (
    <div>
      <h3>Drone {droneId} Position</h3>
      <div>Latitude: {position.latitude}</div>
      <div>Longitude: {position.longitude}</div>
      <div>Altitude: {position.altitude}m</div>
    </div>
  );
}
```

## Integration with State Management

### Using with Zustand Store

```typescript
import { create } from 'zustand';
import useSocketStore from '@cloud/shared/socket/store/socket.store';
import { formatDeviceTopic } from '@cloud/shared/socket/utils/topic-formatter';
import { useEffect } from 'react';

// Create a store for sensor data
const useSensorStore = create((set) => ({
  sensors: {},
  updateSensor: (sensorId, data) =>
    set((state) => ({
      sensors: {
        ...state.sensors,
        [sensorId]: {
          ...state.sensors[sensorId],
          ...data,
          lastUpdated: new Date(),
        },
      },
    })),
}));

// Hook to manage sensor subscriptions
function useSensorData(sensorIds = []) {
  const { subscribe, isConnected } = useSocketStore();
  const updateSensor = useSensorStore((state) => state.updateSensor);

  useEffect(() => {
    if (!isConnected || sensorIds.length === 0) return;

    const unsubscribes = sensorIds.map((sensorId) => {
      const topic = formatDeviceTopic('data', sensorId);

      return subscribe(topic, {
        callback: (data) => {
          updateSensor(sensorId, data);
        },
      });
    });

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [sensorIds, isConnected, subscribe, updateSensor]);

  // Return the sensor data from the store
  return useSensorStore((state) =>
    sensorIds.reduce((acc, id) => {
      acc[id] = state.sensors[id];
      return acc;
    }, {})
  );
}

// Usage in a component
function SensorDashboard({ sensorIds }) {
  const sensors = useSensorData(sensorIds);

  return (
    <div>
      <h2>Sensor Dashboard</h2>
      {Object.entries(sensors).map(([id, data]) => (
        <div key={id}>
          <h3>Sensor {id}</h3>
          {data ? (
            <>
              <div>Value: {data.value}</div>
              <div>Updated: {data.lastUpdated?.toLocaleTimeString()}</div>
            </>
          ) : (
            <div>Waiting for data...</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Best Practices Reminder

Remember to follow these best practices when using the socket library:

1. **Always clean up subscriptions** when components unmount
2. **Use the centralized state pattern** for managing data
3. **Apply throttling** for high-frequency topics
4. **Transform data** at the subscription point to get it in the right format immediately
5. **Handle connection status** appropriately in the UI

For more detailed best practices, see the [Socket Best Practices](../best-practices/socket-best-practices.md) document.
