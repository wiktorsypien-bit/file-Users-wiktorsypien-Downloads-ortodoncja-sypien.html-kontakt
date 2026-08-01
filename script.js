/* Lumira — progressive enhancement only.
   With JavaScript off the page stays fully readable and navigable:
   reveals are gated on the html.js class, the mobile menu and FAQ
   run on native <details>, and anchors scroll via CSS. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ----------------------------------------------------------
     Header — add a border / darker glass once the page scrolls
     ---------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------------------------------------------------------
     Mobile menu — close on link click, outside click, Escape
     ---------------------------------------------------------- */
  var menu = document.querySelector(".nav-menu");
  if (menu) {
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { menu.open = false; });
    });
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") menu.open = false;
    });
  }

  /* ----------------------------------------------------------
     Reveal on scroll
     [data-stagger] parents get their children revealed in
     sequence; [data-stagger="cols-2"] staggers per grid column.
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-stagger]").forEach(function (parent) {
    var mode = parent.getAttribute("data-stagger");
    Array.prototype.forEach.call(parent.children, function (child, i) {
      child.classList.add("reveal");
      var delay = mode === "cols-2" ? (i % 2) * 90 : Math.min(i * 70, 350);
      if (delay) child.style.setProperty("--reveal-delay", delay + "ms");
    });
  });

  var revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -7% 0px" }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ----------------------------------------------------------
     FAQ — animated accordion on top of native <details>.
     Opening one quietly closes the others.
     ---------------------------------------------------------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));

  function openItem(item, body) {
    item.open = true;
    body.animate(
      [{ height: "0px", opacity: 0 }, { height: body.scrollHeight + "px", opacity: 1 }],
      { duration: 320, easing: "cubic-bezier(0.33, 1, 0.68, 1)" }
    );
  }

  function closeItem(item, body) {
    var animation = body.animate(
      [{ height: body.scrollHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: 260, easing: "cubic-bezier(0.33, 1, 0.68, 1)" }
    );
    animation.onfinish = function () { item.open = false; };
  }

  faqItems.forEach(function (item) {
    var summary = item.querySelector("summary");
    var body = item.querySelector(".faq-body");
    if (!summary || !body || typeof body.animate !== "function") return;

    summary.addEventListener("click", function (e) {
      e.preventDefault();

      if (reducedMotion.matches) {
        var willOpen = !item.open;
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
        item.open = willOpen;
        return;
      }

      if (body.getAnimations().length) return; // let the current move finish

      if (item.open) {
        closeItem(item, body);
      } else {
        faqItems.forEach(function (other) {
          if (other !== item && other.open) {
            var otherBody = other.querySelector(".faq-body");
            if (otherBody && !otherBody.getAnimations().length) closeItem(other, otherBody);
          }
        });
        openItem(item, body);
      }
    });
  });

  /* ----------------------------------------------------------
     Newsletter — quiet inline confirmation, no navigation
     ---------------------------------------------------------- */
  var form = document.querySelector(".newsletter");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.querySelector('input[type="email"]');
      if (!email || !email.value || !email.checkValidity()) {
        if (email) email.focus();
        return;
      }
      form.classList.add("is-done");
      var note = form.querySelector(".newsletter-note");
      if (note) note.textContent = "Welcome — you're on the quiet list.";
    });
  }

  /* ----------------------------------------------------------
     Footer year
     ---------------------------------------------------------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
