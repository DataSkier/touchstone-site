# touchstonecommerce.com

The Touchstone Commerce website: plain HTML and CSS, no build step, published with GitHub Pages.

- `/` home page
- `/dodecahedron/` the Dodecahedron Shopify app
- `/dodecahedron/help/` setup guide (linked from the app and its App Store listing)
- `/privacy/` privacy policy (required for the App Store listing and protected customer data access)

Styles live in `assets/style.css`. After changing `assets/style.css` or `assets/dodeca.js`, run `node tools/version-assets.cjs`: it stamps every page's links with a hash of the file (`style.css?v=…`) so visitors never get a new page with a cached old stylesheet. The header and footer are repeated in each page; update them everywhere when they change.

To preview locally, serve the folder from its root (links start with `/`), e.g. `npx serve .`
