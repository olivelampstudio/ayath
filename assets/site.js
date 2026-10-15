/* Ayath website motion. No dependencies, no network requests.
   Everything here is decoration: the page reads the same without it. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Top bar: solid once the page scrolls. */
  var topbar = document.querySelector("[data-topbar]");
  function onScrollBar() {
    if (!topbar) return;
    topbar.classList.toggle("is-solid", window.scrollY > 40);
    // Match the bar to the section beneath it.
    var under = document.elementFromPoint(window.innerWidth / 2, topbar.offsetHeight + 4);
    var dark = !!(under && under.closest(".tone-dark, .horizon")) && !(under && under.closest(".page-doc main"));
    var darkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var lightSection = under && under.closest(".tone-light");
    topbar.classList.toggle("over-dark", dark || (darkScheme && !!lightSection));
  }

  /* Menu on small screens. */
  var menu = document.querySelector("[data-menu]");
  if (menu && topbar) {
    menu.addEventListener("click", function () {
      var open = topbar.classList.toggle("menu-open");
      menu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    topbar.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        topbar.classList.remove("menu-open");
        menu.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Reveal on scroll. */
  var revealables = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          revealer.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    revealables.forEach(function (el) { revealer.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Run a callback while an element is on screen. */
  function whileVisible(el, start, stop) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { start(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.35 }).observe(el);
  }

  /* Parallax and the setting sun, on one animation frame. */
  var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var horizon = document.querySelector("[data-horizon]");
  var sunset = document.querySelector("[data-sunset]");
  var ticking = false;
  function frame() {
    ticking = false;
    onScrollBar();
    if (reduced) return;
    var vh = window.innerHeight;
    parallax.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute("data-parallax"));
      el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
    });
    if (horizon && sunset) {
      var h = horizon.getBoundingClientRect();
      if (h.bottom > 0 && h.top < vh) {
        var p = Math.min(1, Math.max(0, (vh - h.top) / (vh + h.height)));
        sunset.style.transform = "translate3d(0," + (p * h.height * 0.62).toFixed(1) + "px,0)";
      }
    }
  }
  function requestFrame() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
  }
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame);
  frame();

  /* Hifz Coach demo: listen, light words, check, show the result. */
  var demo = document.querySelector("[data-hifz-demo]");
  if (demo) {
    var words = Array.prototype.slice.call(demo.querySelectorAll(".demo-line i"));
    var status = demo.querySelector("[data-status]");
    var steps = document.querySelectorAll("[data-steps] li");
    var timers = [];
    var running = false;
    function setStep(n) {
      steps.forEach(function (s, i) { s.classList.toggle("active", i === n); });
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function showResult() {
      words.forEach(function (w) {
        if (w.classList.contains("miss")) w.classList.add("flag"); else w.classList.add("on");
      });
      demo.classList.remove("listening");
      demo.classList.add("result");
      if (status) status.textContent = "Checked";
      setStep(2);
    }
    function play() {
      clearTimers();
      words.forEach(function (w) { w.classList.remove("on", "flag"); });
      demo.classList.remove("result");
      demo.classList.add("listening");
      if (status) status.textContent = "Listening";
      setStep(0);
      var step = 230;
      words.forEach(function (w, i) {
        timers.push(setTimeout(function () {
          if (!w.classList.contains("miss")) w.classList.add("on");
        }, 500 + i * step));
      });
      var heard = 500 + words.length * step;
      timers.push(setTimeout(function () {
        demo.classList.remove("listening");
        if (status) status.textContent = "Checking on this phone";
        setStep(1);
      }, heard + 200));
      timers.push(setTimeout(showResult, heard + 1300));
      timers.push(setTimeout(function () { if (running) play(); }, heard + 5600));
    }
    if (reduced) {
      showResult();
    } else {
      whileVisible(demo, function () { if (!running) { running = true; play(); } },
        function () { running = false; clearTimers(); });
    }
  }

  /* Prayer arc: five marks and a sun that crosses the day. */
  var arc = document.querySelector("[data-arc]");
  if (arc) {
    var path = arc.querySelector(".arc-path");
    var sun = arc.querySelector(".arc-sun");
    var marks = arc.querySelector(".arc-marks");
    var stops = [0.03, 0.5, 0.68, 0.86, 0.97];
    var names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    var labels = arc.querySelector(".arc-text");
    var total = path.getTotalLength();
    var dots = stops.map(function (s) {
      var pt = path.getPointAtLength(total * s);
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", pt.x.toFixed(1));
      c.setAttribute("cy", pt.y.toFixed(1));
      c.setAttribute("r", "9");
      marks.appendChild(c);
      var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", pt.x.toFixed(1));
      label.setAttribute("y", (pt.y + 20).toFixed(1));
      label.setAttribute("dominant-baseline", "hanging");
      label.setAttribute("text-anchor", "middle");
      label.textContent = names[stops.indexOf(s)];
      labels.appendChild(label);
      return c;
    });
    function place(t) {
      var pt = path.getPointAtLength(total * t);
      sun.setAttribute("cx", pt.x.toFixed(1));
      sun.setAttribute("cy", pt.y.toFixed(1));
      dots.forEach(function (d, i) { d.classList.toggle("lit", t >= stops[i] - 0.005); });
    }
    if (reduced) {
      place(0.68);
    } else {
      var raf = 0, began = 0, duration = 9000;
      var loop = function (now) {
        if (!began) began = now;
        var t = ((now - began) % (duration + 1400)) / duration;
        place(Math.min(1, t));
        raf = window.requestAnimationFrame(loop);
      };
      whileVisible(arc, function () {
        if (!raf) { began = 0; raf = window.requestAnimationFrame(loop); }
      }, function () {
        window.cancelAnimationFrame(raf); raf = 0;
      });
      place(0.03);
    }
  }

  /* Airplane mode: switch on, then everything still works. */
  var plane = document.querySelector("[data-airplane]");
  if (plane && !reduced) {
    whileVisible(plane, function () {
      setTimeout(function () { plane.classList.add("on"); }, 500);
    }, function () {});
  } else if (plane) {
    plane.classList.add("on");
  }

  /* Languages: one word at a time. */
  var word = document.querySelector("[data-langs]");
  if (word && !reduced) {
    var langs = [
      ["English", "en"], ["العربية", "ar"], ["اردو", "ur"], ["हिन्दी", "hi"], ["বাংলা", "bn"],
      ["മലയാളം", "ml"], ["ಕನ್ನಡ", "kn"], ["Bahasa Indonesia", "id"], ["Türkçe", "tr"], ["Français", "fr"]
    ];
    var li = 0, langTimer = 0;
    function next() {
      word.classList.add("out");
      setTimeout(function () {
        li = (li + 1) % langs.length;
        word.textContent = langs[li][0];
        word.setAttribute("lang", langs[li][1]);
        word.classList.remove("out");
      }, 450);
    }
    whileVisible(word, function () {
      if (!langTimer) langTimer = setInterval(next, 2000);
    }, function () {
      clearInterval(langTimer); langTimer = 0;
    });
  }
})();
