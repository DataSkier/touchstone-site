// Dodecahedron pages: the confetti background grows more vivid as the page scrolls.
// Sets --dd-scroll on <html> from 0 (top of the page) to 1 (bottom); the stylesheet does the rest.
(() => {
  const root = document.documentElement;
  let queued = false;
  const update = () => {
    queued = false;
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty("--dd-scroll", max > 0 ? Math.min(1, window.scrollY / max).toFixed(3) : "1");
  };
  const onScroll = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

// Mobile menu: close it after a link is tapped (an in-page jump like "How it works" doesn't load a new page).
(() => {
  const menu = document.getElementById("site-menu");
  if (!menu || !menu.hidePopover) return;
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a") && menu.matches(":popover-open")) menu.hidePopover();
  });
})();
