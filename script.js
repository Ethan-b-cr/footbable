const animatedSections = document.querySelectorAll(
  ".section, .hero-copy, .hero-panel, .site-footer"
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.18,
  }
);

animatedSections.forEach((section) => {
  section.classList.add("reveal");
  observer.observe(section);
});
