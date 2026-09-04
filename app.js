/* Amber for HGSE: flag orbit + concern form */
(function () {
  "use strict";

  /* ---------------- Flag orbit ---------------- */
  var orbit = document.getElementById("orbit");
  var RINGS = [
    { r: 250, count: 34, dur: 150, dir: "normal"  },
    { r: 370, count: 50, dur: 190, dir: "reverse" },
    { r: 490, count: 66, dur: 230, dir: "normal"  },
    { r: 640, count: 98, dur: 280, dir: "reverse" }
  ];
  var FLAG_W = 42;

  function seededShuffle(arr, seed) {
    // Deterministic shuffle so the ring layout is stable between visits.
    var a = arr.slice(), s = seed;
    for (var i = a.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      var j = Math.floor((s / 233280) * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildOrbit(flags) {
    var list = seededShuffle(flags, 7), idx = 0, frag = document.createDocumentFragment();
    RINGS.forEach(function (ring) {
      var el = document.createElement("div");
      el.className = "ring";
      el.style.setProperty("--dur", ring.dur + "s");
      el.style.setProperty("--dir", ring.dir);
      var rev = ring.dir === "normal" ? "reverse" : "normal";
      var n = Math.min(ring.count, list.length - idx);
      for (var i = 0; i < n; i++) {
        var f = list[idx++];
        var wrap = document.createElement("div");
        wrap.className = "flag";
        wrap.style.setProperty("--a", (360 / n) * i + "deg");
        wrap.style.setProperty("--r", ring.r + "px");
        wrap.style.setProperty("--fw", FLAG_W + "px");
        wrap.style.setProperty("--dur", ring.dur + "s");
        wrap.style.setProperty("--rev", rev);
        var img = document.createElement("img");
        img.src = "flags/" + f.code + ".svg";
        img.alt = "";
        img.title = f.name;
        img.decoding = "async";
        wrap.appendChild(img);
        el.appendChild(wrap);
      }
      frag.appendChild(el);
    });
    orbit.appendChild(frag);
  }

  function fitOrbit() {
    var w = window.innerWidth, h = window.innerHeight;
    var s = Math.min(w / 1250, h / 1150, 1);
    orbit.style.setProperty("--orbit-scale", Math.max(0.55, s).toFixed(3));
  }
  window.addEventListener("resize", fitOrbit);
  fitOrbit();

  fetch("flags/flags.json")
    .then(function (r) { return r.json(); })
    .then(buildOrbit)
    .catch(function (e) { console.warn("Flags failed to load", e); });

  /* ---------------- Photo strip: rotates through the photos three times, then fades away ---------------- */
  (function () {
    var wrap = document.getElementById("polaroids");
    var replay = document.getElementById("replay-photos");
    if (!wrap) return;
    var cards = Array.prototype.slice.call(wrap.querySelectorAll(".polaroid"));
    var n = cards.length, CYCLES = 3, STEP = 3200, timer = null, step = 0;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cards.forEach(function (c) { var img = c.querySelector("img"); img.style.objectPosition = c.getAttribute("data-pos") || "center"; });

    // Layout: the "front" card sits centered and upright; the others fan out behind it.
    function layout(front) {
      cards.forEach(function (c, i) {
        var d = (i - front + n) % n;            // 0 = front, then 1..n-1 behind, alternating sides
        var side = d % 2 === 0 ? 1 : -1;
        var depth = Math.ceil(d / 2);
        c.style.setProperty("--x", d === 0 ? "0px" : (side * (110 + depth * 40)) + "px");
        c.style.setProperty("--tilt", d === 0 ? "0deg" : (side * (4 + depth * 3)) + "deg");
        c.style.setProperty("--s", d === 0 ? 1 : 1 - depth * 0.08);
        c.style.setProperty("--o", d === 0 ? 1 : 0.85 - depth * 0.15);
        c.style.setProperty("--z", n - d);
      });
    }

    function start() {
      wrap.classList.remove("gone");
      replay.hidden = true;
      step = 0; layout(0);
      if (reduced) return;                     // static stack for people who prefer less motion
      clearInterval(timer);
      timer = setInterval(function () {
        step++;
        if (step >= n * CYCLES) {              // three full passes done: let them go
          clearInterval(timer);
          wrap.classList.add("gone");
          setTimeout(function () { replay.hidden = false; }, 1200);
          return;
        }
        layout(step % n);
      }, STEP);
    }

    replay.addEventListener("click", start);
    // Only start once the strip is on screen so visitors actually see all three passes.
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); start(); }
      }, { threshold: 0.4 });
      layout(0); io.observe(wrap);
    } else { start(); }
  })();

  /* ---------------- Form ---------------- */
  var cfg = window.SITE_CONFIG || {};
  var form = document.getElementById("concern-form");
  var status = document.getElementById("form-status");
  var btn = document.getElementById("submit-btn");
  var thanks = document.getElementById("thanks");
  var again = document.getElementById("again-btn");
  var DEMO_KEY = "amber-hgse-demo-responses";
  if (!form) return; // pages without the form (results.html) only need the orbit

  function setStatus(msg, kind) {
    status.textContent = msg || "";
    status.className = "status" + (kind ? " " + kind : "");
  }

  function payload() {
    var fd = new FormData(form);
    return {
      action: "submit",
      message: (fd.get("message") || "").trim(),
      category: fd.get("category") || "",
      program: fd.get("program") || "",
      name: (fd.get("name") || "").trim(),
      email: (fd.get("email") || "").trim(),
      website: fd.get("website") || "",
      page: location.href
    };
  }

  function demoSave(p) {
    try {
      var all = JSON.parse(localStorage.getItem(DEMO_KEY) || "[]");
      all.push({ timestamp: new Date().toISOString(), category: p.category, message: p.message,
                 program: p.program, name: p.name, email: p.email });
      localStorage.setItem(DEMO_KEY, JSON.stringify(all));
    } catch (e) { /* storage unavailable: ignore */ }
  }

  function send(p) {
    if (!cfg.endpoint) {
      demoSave(p);
      return Promise.resolve({ ok: true, demo: true });
    }
    return fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(p)
    }).then(function (r) { return r.json(); });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var p = payload();
    var msgField = form.querySelector("textarea[name=message]").closest(".field");
    if (!p.message) {
      msgField.classList.add("invalid");
      setStatus("Please write a few words first. Anything counts.", "error");
      form.querySelector("textarea").focus();
      return;
    }
    msgField.classList.remove("invalid");
    if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
      setStatus("That email doesn't look right. It's optional, so you can also leave it blank.", "error");
      return;
    }
    btn.disabled = true;
    setStatus("Sending…", "info");
    send(p).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "Unknown error");
      setStatus("");
      form.hidden = true;
      thanks.hidden = false;
      if (res.demo) {
        setStatus("");
        var note = document.createElement("p");
        note.className = "tiny";
        note.textContent = "Demo mode: the backend isn't connected yet, so this was saved only in your browser.";
        thanks.appendChild(note);
      }
      thanks.scrollIntoView({ behavior: "smooth", block: "center" });
    }).catch(function (err) {
      console.error(err);
      setStatus("Something went wrong sending that. Please try again in a moment.", "error");
    }).finally(function () { btn.disabled = false; });
  });

  again.addEventListener("click", function () {
    form.reset();
    form.hidden = false;
    thanks.hidden = true;
    var extra = thanks.querySelector("p.tiny"); if (extra) extra.remove();
    form.querySelector("textarea").focus();
  });
})();
