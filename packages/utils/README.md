# Utils Package

Shared utilities, constants, and helper functions for ISO Tracker.

## Utilities

- Date formatting
- Coordinate conversion (RA/Dec → Alt/Az)
- Form validation
- API helpers
- etc.

## Usage

```typescript
import { formatDate, convertCoordinates } from 'utils';

const formattedDate = formatDate(new Date());
const { azimuth, altitude } = convertCoordinates(ra, dec, lat, lon);
```
