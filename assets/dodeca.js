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
