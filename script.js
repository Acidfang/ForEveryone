const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#site-nav");
const timeline = document.querySelector("[data-timeline]");
const steps = [...document.querySelectorAll("[data-step]")];

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("is-open", !open);
});

nav?.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    nav.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  }
});

if (timeline && steps.length) {
  const updateTimeline = () => {
    const viewportGuide = window.innerHeight * 0.52;
    let activeIndex = 0;
    steps.forEach((step, index) => {
      if (step.getBoundingClientRect().top <= viewportGuide) activeIndex = index;
      step.classList.toggle("is-active", index <= activeIndex);
    });
    const progress = ((activeIndex + 1) / steps.length) * 100;
    timeline.style.setProperty("--progress", `${progress}%`);
  };
  updateTimeline();
  document.addEventListener("scroll", updateTimeline, { passive: true });
  window.addEventListener("resize", updateTimeline);
}

document.querySelector("#year").textContent = new Date().getFullYear();
