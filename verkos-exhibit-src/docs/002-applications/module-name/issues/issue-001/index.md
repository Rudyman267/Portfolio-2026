````markdown path=docs/002-modules/flight-management/issues/MM-1234-flight-state-race-condition.md mode=EDIT
# Issue: [MM-1234] - Race Condition in Flight State Management Causing Missing Flight Logs

## Status

In Progress

## Metadata

- **Created by:** [Sourabh Shegane]
- **Created on:** 2025-03-19
- **Reviewers:** Aryaman Singh
- **Last updated:** 2025-03-19
- **Priority:** High
- **ClickUp Task:** 86cy9t0n0

## Description

### Summary

Race condition in mission execution flow causes flight logs to fail due to missing `user_id` and `flight_id` in Redis state.

### Detailed Description

During mission execution, asynchronous MQTT callbacks can overwrite flight state in Redis before proper initialization. This leads to missing critical data (`user_id`, `flight_id`) required for flight logging. The issue affects all flight-generating operations and impacts our ability to track and analyze flight data.

## Occurrence

### Steps to Reproduce

1. Initialize mission execution
2. Monitor Redis state when Mission MQTT callbacks are received.
3. Check flight logs after mission/GTL completion
4. Flight Logs are not created since user_id is missing.

### Environment Details

- **Component:** Mission Management Service

## Impact

### Affected Components

- Mission Execution Service
- Flight Logging

### Business Impact

- Missing flight logs

### Scope

Affects all users executing any type of flight operation:

- Manual missions
- Scheduled flights
- GTL operations
- Alarm response flights

## Root Cause Analysis

Race condition between mission execution and MQTT callback processing:

1. T0: Mission state received; processing starts with incomplete Redis state
2. T1: Mission execution updates Redis with complete state
3. T2: Initial processing completes and overwrites Redis with stale data
4. Result: Critical fields lost, causing log creation failure

## Solution

### Approach

Initialize complete flight state in Redis before triggering any flight commands or MQTT callbacks.

### Implementation Details

```typescript
const flight_state_data = {
  task_id: task?._id,
  flight_id,
  user_id,
  mission_id,
  armed: previous_flight_state?.armed ?? false,
};

// Initialize state before any commands
await this._mqtt_service.propagate_flight_state(org_id, device_id, flight_state_data, 'execute_mission');
// Then proceed with flight commands
```

### Dependencies

- Redis state management
- MQTT service
- Mission execution service

## Testing

### Test Cases

1. Mission execution
2. Go To Location

### Verification Steps

1. Monitor Redis state during flight operations
2. Verify flight_state contains all required fields
3. Check flight logs are created

## Review

### Lessons Learned

- Need better state management architecture
- Consider implementing state machine pattern
- Add more comprehensive state validation
- Improve monitoring for state-related issues

## Deployment

### Release Notes

Fixed issue where flight logs were failing due to missing state data. Improved reliability of flight tracking across all operation types.

### Rollback Plan

1. Revert commit
2. Deploy previous version
3. Monitor flight logs for any issues

### Post-Deployment Verification

1. Execute test flights across all operation types
2. Verify flight logs are complete
````
