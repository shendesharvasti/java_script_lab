/* Interactive portfolio behaviours — no framework required */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Typing effect */
const typingText = $("#typingText");
const roles = ["Generative AI", "Agentic AI", "RAG systems", "Computer Vision", "LLM applications"];
let roleIndex = 0, charIndex = 0, deleting = false, typingTimer;
function typeLoop() {
  if (!typingText) return;
  const word = roles[roleIndex];
  typingText.textContent = word.slice(0, charIndex);
  let delay = deleting ? 38 : 75;
  if (!deleting && charIndex < word.length) charIndex++;
  else if (!deleting) { deleting = true; delay = 1300; }
  else if (charIndex > 0) charIndex--;
  else { deleting = false; roleIndex = (roleIndex + 1) % roles.length; delay = 300; }
  typingTimer = setTimeout(typeLoop, delay);
}
if (!reduceMotion) typeLoop();
else typingText.textContent = roles[0];

/* Scroll reveals: elements animate only when entering the viewport */
const revealItems = $$(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  revealItems.forEach((el, index) => {
    el.style.transitionDelay = `${(index % 3) * 75}ms`;
    revealObserver.observe(el);
  });
} else revealItems.forEach(el => el.classList.add("is-visible"));

/* Reading progress bar */
const progressBar = $("#readingProgress");
let scrollQueued = false;
function updateScrollUI() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${Math.min(100, percent)}%`;
  scrollQueued = false;
}
window.addEventListener("scroll", () => {
  if (!scrollQueued) {
    requestAnimationFrame(updateScrollUI);
    scrollQueued = true;
  }
}, { passive: true });
updateScrollUI();

/* Mobile navigation */
const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});
$$(".main-nav a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

/* Light/dark theme, with saved preference */
const themeToggle = $("#themeToggle");
const themeIcon = $("#themeIcon");
function applyTheme(theme) {
  document.body.classList.toggle("light-theme", theme === "light");
  themeIcon.textContent = theme === "light" ? "☾" : "☼";
  themeToggle.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
  document.querySelector('meta[name="theme-color"]').content = theme === "light" ? "#f4f3ef" : "#090909";
}
let savedTheme = "dark";
try { savedTheme = localStorage.getItem("shravasti-portfolio-theme") || "dark"; } catch {}
applyTheme(savedTheme);
themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
  applyTheme(nextTheme);
  try { localStorage.setItem("shravasti-portfolio-theme", nextTheme); } catch {}
});

/* Active navigation section */
const navLinks = $$(".main-nav a");
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  ["about", "skills", "projects", "journey", "contact"].forEach(id => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });
}

/* Skill category filter */
$$("[data-skill-filter]").forEach(button => {
  button.addEventListener("click", () => {
    $$("[data-skill-filter]").forEach(b => b.classList.toggle("active", b === button));
    const filter = button.dataset.skillFilter;
    $$(".skill-panel").forEach(card => {
      const show = filter === "all" || card.dataset.skillCategory === filter;
      card.classList.toggle("is-filtered", !show);
    });
  });
});

/* Project filter and live count */
const projectCards = $$(".project-card");
const projectCount = $("#projectCount");
function updateProjectCount() {
  const visible = projectCards.filter(card => !card.classList.contains("is-filtered")).length;
  projectCount.textContent = String(visible).padStart(2, "0");
}
$$("[data-project-filter]").forEach(button => {
  button.addEventListener("click", () => {
    $$("[data-project-filter]").forEach(b => b.classList.toggle("active", b === button));
    const filter = button.dataset.projectFilter;
    projectCards.forEach(card => {
      const categories = card.dataset.projectCategory.split(" ");
      card.classList.toggle("is-filtered", filter !== "all" && !categories.includes(filter));
    });
    updateProjectCount();
  });
});
updateProjectCount();

/* Accessible project-detail dialogs */
$$("[data-modal]").forEach(button => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.modal);
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
  });
});
$$("[data-close]").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
$$("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
});

/* Certificate image lightbox */
const imageModal = $("#imageModal");
const certificatePreview = $("#certificatePreview");
const imageCaption = $("#imageCaption");
$$(".certificate-open").forEach(button => {
  button.addEventListener("click", () => {
    certificatePreview.src = button.dataset.image;
    certificatePreview.alt = button.dataset.caption;
    imageCaption.textContent = button.dataset.caption;
    if (typeof imageModal.showModal === "function") imageModal.showModal();
  });
});
imageModal.addEventListener("close", () => { certificatePreview.src = ""; });

/* Copy email with fallback and visible feedback */
const toast = $("#toast");
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}
$("#copyEmail").addEventListener("click", async event => {
  const email = event.currentTarget.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    showToast("Email copied to clipboard");
  } catch {
    const temporary = document.createElement("textarea");
    temporary.value = email;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.appendChild(temporary);
    temporary.select();
    const copied = document.execCommand("copy");
    temporary.remove();
    showToast(copied ? "Email copied to clipboard" : email);
  }
});

/* Pointer glow */
const cursorAura = $(".cursor-aura");
if (window.matchMedia("(pointer:fine)").matches && !reduceMotion) {
  window.addEventListener("pointermove", event => {
    cursorAura.style.left = `${event.clientX}px`;
    cursorAura.style.top = `${event.clientY}px`;
  }, { passive: true });
} else cursorAura.remove();

/* Lightweight animated particle network */
const canvas = $("#particles");
const context = canvas.getContext("2d");
let particles = [], canvasWidth = 0, canvasHeight = 0, particleFrame;
function resizeParticles() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const total = Math.min(65, Math.floor((canvasWidth * canvasHeight) / 18000));
  particles = Array.from({ length: total }, () => ({
    x: Math.random() * canvasWidth, y: Math.random() * canvasHeight,
    vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
    r: Math.random() * 1.2 + .4
  }));
}
function drawParticles() {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  particles.forEach((p, i) => {
    if (!reduceMotion) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvasWidth) p.vx *= -1;
      if (p.y < 0 || p.y > canvasHeight) p.vy *= -1;
    }
    context.beginPath();
    context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    context.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#aaa";
    context.globalAlpha = .6; context.fill(); context.globalAlpha = 1;
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j], dx = p.x - q.x, dy = p.y - q.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 105) {
        context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(q.x, q.y);
        context.strokeStyle = getComputedStyle(document.body).getPropertyValue("--line-strong").trim() || "rgba(255,255,255,.2)";
        context.globalAlpha = (1 - distance / 105) * .45;
        context.lineWidth = .6; context.stroke(); context.globalAlpha = 1;
      }
    }
  });
  if (!reduceMotion) particleFrame = requestAnimationFrame(drawParticles);
}
resizeParticles();
drawParticles();
window.addEventListener("resize", () => {
  cancelAnimationFrame(particleFrame);
  resizeParticles();
  drawParticles();
}, { passive: true });

/* Current year */
$("#currentYear").textContent = new Date().getFullYear();
