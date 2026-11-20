// Cookie consent for Google Tag Manager / Google Analytics, using Google Consent Mode v2.
// Each page's <head> sets the defaults before GTM loads: analytics denied in the EEA, UK and Switzerland (Google
// applies that by the visitor's location), granted elsewhere unless the browser sends Global Privacy Control; ad
// storage is always denied. This file shows the banner, saves the choice and tells Google about it.
// Any element with data-consent-open (the footer's "Cookie settings") reopens the banner.
(function () {
  var KEY = "tc-consent"; // "granted" | "denied"
  var read = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var save = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
  var gtag = window.gtag || function () { (window.dataLayer = window.dataLayer || []).push(arguments); };

  // The banner only needs to ask where opt-in is the default. Time zone is a stand-in for location; a European
  // visitor it misses stays opted out, because Google's regional default still applies.
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var optInRegion = /^Europe\//.test(tz) || /^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)$/.test(tz);

  var banner;
  function choose(value) {
    save(value);
    gtag("consent", "update", { analytics_storage: value });
    if (value === "granted") (window.dataLayer = window.dataLayer || []).push({ event: "consent_granted" });
    hide();
  }
  function hide() { if (banner) banner.hidden = true; }
  function show() {
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "consent";
      banner.setAttribute("role", "dialog");
      banner.setAttribute("aria-label", "Cookie choices");
      banner.innerHTML =
        '<p>We use cookies for analytics, to see which pages are useful. No advertising. ' +
        '<a href="/privacy/#this-website">Privacy policy</a></p>' +
        '<div class="consent-actions">' +
        '<button type="button" class="consent-btn" data-choice="denied">Decline</button>' +
        '<button type="button" class="consent-btn consent-btn--primary" data-choice="granted">Accept</button>' +
        "</div>";
      banner.addEventListener("click", function (e) {
        var c = e.target.getAttribute && e.target.getAttribute("data-choice");
        if (c) choose(c);
      });
      document.body.appendChild(banner);
    }
    banner.hidden = false;
  }

  function init() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-consent-open]");
      if (t) { e.preventDefault(); show(); }
    });
    if (!read() && optInRegion) show();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
