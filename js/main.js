/**
 * Voice of Peace — site interactions
 * Sticky header, mobile nav, scroll spy, reveals, form, reduced motion.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("site-header");
  var toggle = document.querySelector(".nav-toggle");
  var overlay = document.getElementById("mobile-nav");
  var body = document.body;
  var form = document.getElementById("contact-form");
  var success = document.getElementById("form-success");
  var intentSelect = document.getElementById("intent");
  var privacyDialog = document.getElementById("privacy");
  var privacyLink = document.getElementById("privacy-link");
  var timeline = document.getElementById("timeline");
  var year = document.getElementById("year");
  var lastToggleFocus = null;

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  /* ----- Sticky header ----- */
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ----- Mobile navigation ----- */
  function getOverlayLinks() {
    return overlay ? Array.prototype.slice.call(overlay.querySelectorAll("a")) : [];
  }

  function setNavOpen(open) {
    if (!toggle || !overlay) return;

    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    body.classList.toggle("is-nav-open", open);
    overlay.setAttribute("aria-hidden", open ? "false" : "true");

    if (open) {
      overlay.hidden = false;
      lastToggleFocus = document.activeElement;
      requestAnimationFrame(function () {
        overlay.classList.add("is-open");
        var first = getOverlayLinks()[0];
        if (first) first.focus();
      });
    } else {
      overlay.classList.remove("is-open");
      window.setTimeout(function () {
        if (!overlay.classList.contains("is-open")) overlay.hidden = true;
      }, reduceMotion ? 0 : 400);
      if (lastToggleFocus && typeof lastToggleFocus.focus === "function") {
        lastToggleFocus.focus();
      }
    }
  }

  if (toggle && overlay) {
    toggle.addEventListener("click", function () {
      setNavOpen(!overlay.classList.contains("is-open"));
    });

    overlay.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (link) setNavOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && overlay.classList.contains("is-open")) {
        setNavOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!overlay.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        setNavOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      var links = getOverlayLinks();
      if (!links.length) return;

      var first = links[0];
      var last = links[links.length - 1];

      if (event.shiftKey && document.activeElement === toggle) {
        event.preventDefault();
        last.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        toggle.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        toggle.focus();
      }
    });
  }

  /* ----- Smooth in-page scrolling ----- */
  function prefersAutoScroll() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute("href");
    if (!id || id === "#") return;

    if (id === "#privacy") {
      event.preventDefault();
      if (privacyDialog && typeof privacyDialog.showModal === "function") {
        privacyDialog.showModal();
      }
      return;
    }

    var target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersAutoScroll() ? "auto" : "smooth",
      block: "start"
    });

    if (link.hasAttribute("data-intent") && intentSelect) {
      intentSelect.value = link.getAttribute("data-intent");
    }
  });

  /* ----- Active nav highlighting ----- */
  var sectionIds = ["about", "journey", "what-we-do", "regional-events", "principles", "get-involved", "contact"];
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-desktop a[href^="#"]'));

  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", match);
      if (match) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window) {
    var spyObserver = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (entry) { return entry.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });

        if (visible[0]) setActiveNav(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    sectionIds.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spyObserver.observe(section);
    });
  }

  /* ----- Scroll reveals ----- */
  function revealAll() {
    document.querySelectorAll(".reveal, .reveal-stagger").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  function observeReveals() {
    var els = document.querySelectorAll(".reveal, .reveal-stagger");
    if (!("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    els.forEach(function (el) { observer.observe(el); });
  }

  if (reduceMotion) {
    revealAll();
  } else {
    observeReveals();
  }

  /* ----- Timeline progress ----- */
  function setTimelineProgress(value) {
    if (!timeline) return;
    timeline.style.setProperty("--progress", String(value));
  }

  if (timeline) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      setTimelineProgress(1);
    } else {
      var started = false;
      var timelineObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting || started) return;
            started = true;
            setTimelineProgress(1);
            timelineObserver.unobserve(timeline);
          });
        },
        { threshold: 0.35 }
      );
      setTimelineProgress(0);
      timelineObserver.observe(timeline);
    }
  }

  /* ----- Contact form ----- */
  function showError(id, show) {
    var input = document.getElementById(id);
    var error = document.querySelector('[data-error-for="' + id + '"]');
    if (error) error.hidden = !show;
    if (input) input.setAttribute("aria-invalid", show ? "true" : "false");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = document.getElementById("name");
      var email = document.getElementById("email");
      var message = document.getElementById("message");
      var organisation = document.getElementById("organisation");
      var valid = true;

      showError("name", !(name && name.value.trim()));
      if (!(name && name.value.trim())) valid = false;

      showError("email", !(email && isValidEmail(email.value.trim())));
      if (!(email && isValidEmail(email.value.trim()))) valid = false;

      showError("message", !(message && message.value.trim()));
      if (!(message && message.value.trim())) valid = false;

      if (!valid) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var intent = intentSelect ? intentSelect.value : "contact";
      var subject = "Voice of Peace — " + intent;
      var body = [
        "Name: " + name.value.trim(),
        "Email: " + email.value.trim(),
        "Organisation: " + ((organisation && organisation.value.trim()) || "—"),
        "Intent: " + intent,
        "",
        message.value.trim()
      ].join("\n");

      window.location.href =
        "mailto:hello@voiceofpeace.org?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);

      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.focus();
      }
    });
  }

  /* ----- Privacy dialog ----- */
  if (privacyLink && privacyDialog) {
    privacyLink.addEventListener("click", function (event) {
      event.preventDefault();
      if (typeof privacyDialog.showModal === "function") {
        privacyDialog.showModal();
      }
    });
  }
})();
