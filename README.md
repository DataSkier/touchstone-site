# touchstonecommerce.com

The Touchstone Commerce website: plain HTML and CSS, no build step, published with GitHub Pages.

- `/` home page
- `/dodecahedron/` the Dodecahedron Shopify app
- `/dodecahedron/help/` setup guide (linked from the app and its App Store listing)
- `/privacy/` privacy policy (required for the App Store listing and protected customer data access)
- `/terms/` terms of service and data processing addendum (linked from the App Store listing)

Styles live in `assets/style.css`. After changing `assets/style.css`, `assets/dodeca.js`, `assets/dodeca-demo.js` or `assets/consent.js`, run `node tools/version-assets.cjs`: it stamps every page's links with a hash of the file (`style.css?v=…`) so visitors never get a new page with a cached old stylesheet. The header and footer are repeated in each page; update them everywhere when they change.

To preview locally, serve the folder from its root (links start with `/`), e.g. `npx serve .`

Analytics: every page loads Google Tag Manager (`GTM-NS47CZZ3`) after Google Consent Mode v2 defaults set inline in `<head>`: analytics denied in the EEA, UK and Switzerland until accepted, granted elsewhere unless the browser sends Global Privacy Control, ads always denied. `assets/consent.js` shows the banner and saves the choice; the footer's "Cookie settings" reopens it. New pages need the same `<head>` and `<body>` snippets, and the privacy policy ("This website") must match whatever tags run in the container.
