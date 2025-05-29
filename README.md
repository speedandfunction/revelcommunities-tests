# Tests for RevelCommunities WP Pantheon based project

there are a few automatic PlayWright tests for the project.

Live: https://www.revelcommunities.com/

Test: https://test-revelcommunities.pantheonsite.io/

Dev: https://dev-revelcommunities.pantheonsite.io/

Installation

```npm i```

Run Tests

## Global test

You can manage pages to test in the `multi-page-visual.test.js` file:

```javascript
const PAGES_TO_TEST = [
  '/', // Homepage
  '/communities/',
  '/communities/eagle/',
  '/communities/eagle/site-map/'
];
```

You can manage viewports to test in the `multi-page-visual.test.js` file:

```javascript
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};
```

```
# Run test
npx playwright test multi-page-visual.test.js

# Run test only for Chrome
npx playwright test multi-page-visual.test.js --project=chromium
```
