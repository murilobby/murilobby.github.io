const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
const menuLinks = menu?.querySelectorAll("a") ?? [];

function closeMenu() {
  menu?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "Abrir menu");
  document.body.classList.remove("menu-open");
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menu.classList.toggle("is-open", !isOpen);
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  document.body.classList.toggle("menu-open", !isOpen);
});

menuLinks.forEach((link) => link.addEventListener("click", closeMenu));

// Evita manter a pagina bloqueada ao sair do layout mobile com o menu aberto.
window.matchMedia("(max-width: 820px)").addEventListener("change", (event) => {
  if (!event.matches) closeMenu();
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionToggle = document.querySelector("[data-motion-toggle]");
const motionLabel = document.querySelector("[data-motion-label]");
const motionStorageKey = "murilo-smooth-navigation";
let motionPreference = true;
let scrollFrame = null;

try {
  const savedPreference = localStorage.getItem(motionStorageKey);
  if (savedPreference === "on" || savedPreference === "off") {
    motionPreference = savedPreference === "on";
  }
} catch {
  // A escolha ainda funciona nesta pagina se o armazenamento estiver bloqueado.
}

function smoothNavigationEnabled() {
  return motionPreference;
}

function updateMotionToggle() {
  if (!motionToggle) return;
  const enabled = smoothNavigationEnabled();
  motionToggle.hidden = false;
  motionToggle.setAttribute("aria-pressed", String(enabled));
  if (motionLabel) motionLabel.textContent = enabled ? "Rolagem suave ativada" : "Ativar rolagem suave";
  motionToggle.title = enabled ? "Clique para desativar a animacao de rolagem" : "Clique para ativar a animacao de rolagem";
}

motionToggle?.addEventListener("click", () => {
  motionPreference = !smoothNavigationEnabled();
  cancelNavigationScroll();
  try {
    localStorage.setItem(motionStorageKey, motionPreference ? "on" : "off");
  } catch {
    // Navegacao privada e arquivos locais podem bloquear localStorage.
  }
  updateMotionToggle();
});

updateMotionToggle();

function cancelNavigationScroll() {
  if (scrollFrame !== null) {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
  }
}

function navigateToSection(target, hash) {
  cancelNavigationScroll();
  closeMenu();

  const startY = window.scrollY;
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const offset = Math.max(padding, (header?.getBoundingClientRect().height ?? 0) + 12);
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const endY = Math.min(maxY, Math.max(0, target.getBoundingClientRect().top + startY - offset));
  const distance = endY - startY;
  const duration = Math.min(1200, Math.max(650, Math.abs(distance) * 0.18));
  let startedAt = null;

  function finishNavigation() {
    scrollFrame = null;
    // Atualiza a ancora sem disparar uma segunda rolagem do navegador.
    if (window.location.hash !== hash) {
      try {
        window.history.pushState(null, "", hash);
      } catch {
        // Alguns navegadores restringem history ao abrir arquivos locais.
      }
    }

    // Leva o foco de teclado para a secao sem deslocar a pagina.
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    }
    target.focus({ preventScroll: true });
  }

  if (!smoothNavigationEnabled() || Math.abs(distance) < 1) {
    window.scrollTo({ top: endY, behavior: "instant" });
    finishNavigation();
    return;
  }

  function animateScroll(timestamp) {
    startedAt ??= timestamp;
    const progress = Math.min((timestamp - startedAt) / duration, 1);
    const eased = progress < 0.5
      ? 4 * progress ** 3
      : 1 - (-2 * progress + 2) ** 3 / 2;

    // Cada frame posiciona diretamente; a suavidade vem da curva acima.
    window.scrollTo({ top: startY + distance * eased, behavior: "instant" });

    if (progress < 1) {
      scrollFrame = requestAnimationFrame(animateScroll);
    } else {
      finishNavigation();
    }
  }

  scrollFrame = requestAnimationFrame(animateScroll);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute("href");
    if (!hash || hash === "#" || link.hasAttribute("download") || link.target === "_blank") return;
    let target;
    try {
      target = document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return;
    }
    if (!target) return;
    event.preventDefault();
    navigateToSection(target, hash);
  });
});

["wheel", "touchstart", "pointerdown", "popstate", "hashchange"].forEach((eventName) => {
  window.addEventListener(eventName, cancelNavigationScroll, { passive: true });
});

document.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape", "Tab"].includes(event.key)) {
    cancelNavigationScroll();
  }
});

reducedMotion.addEventListener("change", () => {
  updateMotionToggle();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function updateHeader() {
  header?.classList.toggle("scrolled", window.scrollY > 24);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -36px" },
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const yearElement = document.querySelector("[data-year]");
if (yearElement) yearElement.textContent = new Date().getFullYear();

const photoButton = document.querySelector("[data-photo-open]");
const photoDialog = document.querySelector("[data-photo-dialog]");
const photoFrame = document.querySelector("[data-photo-frame]");
const photoClose = document.querySelector("[data-photo-close]");
let photoAnimation = null;
let photoClosing = false;

function thumbnailTransform() {
  const thumbnail = photoButton.querySelector("img").getBoundingClientRect();
  const expanded = photoFrame.parentElement.getBoundingClientRect();
  const x = thumbnail.left + thumbnail.width / 2 - expanded.left - expanded.width / 2;
  const y = thumbnail.top + thumbnail.height / 2 - expanded.top - expanded.height / 2;
  return `translate(${x}px, ${y}px) scale(${thumbnail.width / expanded.width})`;
}

photoButton?.addEventListener("click", () => {
  if (photoDialog.open) return;
  cancelNavigationScroll();
  closeMenu();
  document.documentElement.classList.add("photo-open");
  photoDialog.showModal();
  photoClose.focus({ preventScroll: true });
  photoAnimation = photoFrame.animate([
    { transform: thumbnailTransform(), borderRadius: "50%" },
    { transform: "none", borderRadius: "24px" },
  ], { duration: reducedMotion.matches ? 0 : 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
});

async function closePhoto() {
  if (!photoDialog.open || photoClosing) return;
  photoClosing = true;
  const current = getComputedStyle(photoFrame);
  const start = { transform: current.transform, borderRadius: current.borderRadius };
  photoAnimation?.cancel();
  photoDialog.classList.add("is-closing");
  photoAnimation = photoFrame.animate([
    start,
    { transform: thumbnailTransform(), borderRadius: "50%" },
  ], { duration: reducedMotion.matches ? 0 : 280, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" });
  await photoAnimation.finished;
  photoDialog.close();
  photoAnimation.cancel();
  photoDialog.classList.remove("is-closing");
  document.documentElement.classList.remove("photo-open");
  photoClosing = false;
  photoButton.focus({ preventScroll: true });
}

photoClose?.addEventListener("click", closePhoto);
photoDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closePhoto();
});
photoDialog?.addEventListener("click", (event) => {
  if (event.target === photoDialog) closePhoto();
});
