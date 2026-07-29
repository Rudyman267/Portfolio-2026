# Telemetry Topics Documentation

This document provides a set of telemetry topics with example JSON data for each endpoint based on the `OPERATIONAL` configuration in `device-topics.ts`.

Each topic follows the format:

```
{org-id}/{drone-id}/telemetry/<attribute>
```

Where `<attribute>` can be one of `status`, `position`, `pilot`, `battery`, `environment`, or `maintenance`.

---

## 1. Telemetry Status

**Topic**: `{org-id}/{drone-id}/telemetry/status`

**Expected JSON Example**:

```json
{
  "deviceId": "drone-123",
  "timestamp": 1652985600000,
  "status": {
    "connected": true,
    "operationMode": "auto",
    "flightStatus": "in-flight",
    "deviceHealth": "good"
  }
}
```

_Notes_: Contains operational status details, including connectivity, mode, flight, and health.

---

## 2. Telemetry Position

**Topic**: `{org-id}/{drone-id}/telemetry/position`

**Expected JSON Example**:

```json
{
  "deviceId": "drone-123",
  "timestamp": 1652985600000,
  "position": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 1500,
    "heading": 90,
    "distanceFromHome": 250,
    "homePoint": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "altitude": 50
    }
  }
}
```

_Notes_: Provides geospatial data such as latitude, longitude, altitude, heading, and the distance from the designated home point.

---

## 3. Telemetry Pilot

**Topic**: `{org-id}/{drone-id}/telemetry/pilot`

**Expected JSON Example**:

```json
{
  "deviceId": "drone-123",
  "timestamp": 1652985600000,
  "pilot": {
    "name": "Jane Doe",
    "isInControl": true
  }
}
```

_Notes_: Contains pilot related information such as the pilot's name and whether they are in control of the drone.

---

## 4. Telemetry Battery

**Topic**: `{org-id}/{drone-id}/telemetry/battery`

**Expected JSON Example**:

```json
{
  "deviceId": "drone-123",
  "timestamp": 1652985600000,
  "battery": {
    "level": 85,
    "health": "good"
  }
}
```

_Notes_: Contains battery-related telemetry data, including battery level and health status.

---

## 5. Telemetry Environment

**Topic**: `{org-id}/{drone-id}/telemetry/environment`

**Expected JSON Example**:

```json
{
  "deviceId": "drone-123",
  "timestamp": 1652985600000,
  "environment": {
    "temperature": 22.5,
    "humidity": 60
  }
}
```

_Notes_: Provides environmental sensor readings such as temperature and humidity.

---

## 6. Telemetry Maintenance

**Topic**: `{org-id}/{drone-id}/telemetry/maintenance`

**Expected JSON Example**:

```json
{
  "deviceId": "drone-123",
  "timestamp": 1652985600000,
  "maintenance": {
    "lastService": "2025-01-01T00:00:00Z",
    "issuesReported": []
  }
}
```

_Notes_: Contains maintenance-related telemetry data, such as service history and reported issues.

---

For full context, refer to the `OPERATIONAL` key definition in [device-topics.ts](./enums/device-topics.ts) for detailed structure requirements.
