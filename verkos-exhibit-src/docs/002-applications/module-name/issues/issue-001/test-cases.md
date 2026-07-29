| Case                                  | Expected                      | Actual | Device |
| ------------------------------------- | ----------------------------- | ------ | ------ |
| Launch Mission                        |                               | ok     |        |
| Launch GTL                            |                               | ok     |        |
| Launch Mission → GTL → Resume Mission |                               |        |        |
| Launch GTL → GTL                      | Flight logs should be created | ok     | Sim    |

## What to Test

Test flight logging across all flight-generating operations:

- Waypoint Missions
- Go To Location (GTL)
- Scheduled Flights
- Alarm Response Flights
