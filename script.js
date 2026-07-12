/* ============================================================
   oSTEM @ UMich script.js
   You should NOT need to edit this file to update content.
   Events live in events.js; resource links live in index.html.

   What this file does:
   1. Reads window.OSTEM_EVENTS (from events.js), sorts by date,
      renders upcoming events as cards, and tucks past events
      into a collapsed "Past events" list.
   2. Powers the header search box, filtering both resources
      and events, with a screen-reader-friendly status message.

   Everything is built with createElement/textContent (never
   innerHTML with data), so event text can safely contain any
   characters.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- small helpers ---------- */

  // Parse "YYYY-MM-DD" as a LOCAL date (avoids the classic
  // timezone bug where new Date("2026-09-16") shifts a day).
  function parseLocalDate(str) {
    if (typeof str !== "string") return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str.trim());
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /* ---------- 1. EVENTS ---------- */

  function renderEvents() {
    var listEl = document.getElementById("eventsList");
    if (!listEl) return;

    var raw = Array.isArray(window.OSTEM_EVENTS) ? window.OSTEM_EVENTS : [];

    // Keep only entries with a title and a valid date; attach parsed date.
    var events = [];
    raw.forEach(function (ev) {
      if (!ev || typeof ev !== "object") return;
      var d = parseLocalDate(ev.date);
      if (!d || !ev.title) return;
      events.push({
        title: String(ev.title),
        date: d,
        time: ev.time ? String(ev.time) : "",
        location: ev.location ? String(ev.location) : "",
        description: ev.description ? String(ev.description) : "",
        link: ev.link ? String(ev.link) : ""
      });
    });

    events.sort(function (a, b) { return a.date - b.date; });

    var today = startOfToday();
    var upcoming = events.filter(function (e) { return e.date >= today; });
    var past = events.filter(function (e) { return e.date < today; });

    // Upcoming cards
    if (upcoming.length === 0) {
      var empty = el("p", "events-empty",
        "Nothing on the calendar just yet. Check back soon, or peek at our Google Calendar and Instagram for the latest.");
      listEl.replaceChildren(empty);
    } else {
      var frag = document.createDocumentFragment();
      upcoming.forEach(function (ev) {
        frag.appendChild(buildEventCard(ev));
      });
      listEl.replaceChildren(frag);
    }

    // Past events (collapsed)
    var wrap = document.getElementById("pastEventsWrap");
    var pastList = document.getElementById("pastEventsList");
    if (wrap && pastList && past.length > 0) {
      var pfrag = document.createDocumentFragment();
      // Most recent past event first
      past.slice().reverse().forEach(function (ev) {
        var li = el("li", null,
          ev.title + " (" + MONTHS[ev.date.getMonth()] + " " +
          ev.date.getDate() + ", " + ev.date.getFullYear() + ")");
        pfrag.appendChild(li);
      });
      pastList.replaceChildren(pfrag);
      wrap.hidden = false;
    }
  }

  function buildEventCard(ev) {
    var card = el("article", "event-card filter-item");

    // Searchable text for the filter
    card.setAttribute("data-keywords",
      (ev.title + " " + ev.location + " " + ev.description + " event events").toLowerCase());

    // Date badge: big day number + weekday/month (visual), with a
    // naturally-ordered hidden version for screen readers.
    var badge = el("div", "event-date-badge");
    var dayVis = el("span", "edb-day",
      MONTHS_SHORT[ev.date.getMonth()] + " " + ev.date.getDate());
    dayVis.setAttribute("aria-hidden", "true");
    var restVis = el("span", "edb-rest", "· " + DAYS[ev.date.getDay()]);
    restVis.setAttribute("aria-hidden", "true");
    var srDate = el("span", "visually-hidden",
      DAYS[ev.date.getDay()] + ", " + MONTHS[ev.date.getMonth()] + " " +
      ev.date.getDate() + ", " + ev.date.getFullYear());
    badge.appendChild(dayVis);
    badge.appendChild(restVis);
    badge.appendChild(srDate);
    card.appendChild(badge);

    var body = el("div", "event-body");
    body.appendChild(el("h3", null, ev.title));

    var metaBits = [];
    if (ev.time) metaBits.push(ev.time);
    if (ev.location) metaBits.push(ev.location);
    if (metaBits.length) body.appendChild(el("p", "event-meta", metaBits.join(" · ")));

    if (ev.description) body.appendChild(el("p", "event-desc", ev.description));

    // "Add to calendar" downloads an .ics file (works with Google
    // Calendar, Apple Calendar, and Outlook). Saved as an all-day
    // event with the time noted in the description, since event
    // times in events.js are free-form text.
    var ics = buildIcs(ev);
    if (ics) {
      var cal = el("a", "event-link event-cal", "Add to calendar");
      cal.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
      cal.setAttribute("download",
        ev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".ics");
      body.appendChild(cal);
    }

    if (ev.link && /^https?:\/\//i.test(ev.link)) {
      var a = el("a", "event-link", "Details / RSVP");
      a.href = ev.link;
      a.target = "_blank";
      a.rel = "noreferrer";
      var ext = el("span", "ext", "↗");
      ext.setAttribute("aria-hidden", "true");
      a.appendChild(ext);
      var sr = el("span", "visually-hidden", "(opens in new tab)");
      a.appendChild(sr);
      body.appendChild(a);
    }

    card.appendChild(body);
    return card;
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function icsEscape(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function buildIcs(ev) {
    if (!ev || !ev.date) return "";
    var d = ev.date;
    var next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    function stamp(dt) {
      return "" + dt.getFullYear() + pad2(dt.getMonth() + 1) + pad2(dt.getDate());
    }
    var desc = [];
    if (ev.time) desc.push("Time: " + ev.time);
    if (ev.description) desc.push(ev.description);
    if (ev.link) desc.push(ev.link);

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//oSTEM at UMich//Resource Hub//EN",
      "BEGIN:VEVENT",
      "UID:" + stamp(d) + "-" + ev.title.replace(/[^A-Za-z0-9]/g, "") + "@ostem-umich",
      "DTSTAMP:" + stamp(new Date()) + "T000000Z",
      "DTSTART;VALUE=DATE:" + stamp(d),
      "DTEND;VALUE=DATE:" + stamp(next),
      "SUMMARY:" + icsEscape(ev.title),
      ev.location ? "LOCATION:" + icsEscape(ev.location) : "",
      desc.length ? "DESCRIPTION:" + icsEscape(desc.join("\n")) : "",
      "END:VEVENT",
      "END:VCALENDAR"
    ].filter(Boolean).join("\r\n");
  }

  /* ---------- 2. SEARCH / FILTER ---------- */

  function setUpSearch() {
    var form = document.getElementById("searchForm");
    var input = document.getElementById("searchInput");
    var status = document.getElementById("searchStatus");
    var noResults = document.getElementById("noResults");
    if (!form || !input) return;

    // Search only appears once JS is confirmed working.
    form.hidden = false;

    var clearBtn = document.getElementById("clearSearch");
    var debounceTimer = null;

    // Pressing Enter: apply the filter right away, then jump down
    // to the Resources section so results are on screen. Listening on
    // BOTH the form submit and the raw keydown makes this reliable
    // everywhere (some setups swallow implicit form submission).
    function goToResults() {
      clearTimeout(debounceTimer);
      applyFilter();

      var resources = document.getElementById("resources");
      var heading = document.getElementById("resources-heading");
      if (resources && typeof resources.scrollIntoView === "function") {
        // scroll-behavior in CSS handles smooth vs. instant
        // (and prefers-reduced-motion disables the animation)
        resources.scrollIntoView();
      }
      // Move keyboard/screen-reader focus to the section heading
      if (heading) {
        try { heading.focus({ preventScroll: true }); }
        catch (err) { heading.focus(); }
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      goToResults();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        goToResults();
      }
    });

    input.addEventListener("input", function () {
      resetChips();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilter, 120);
    });

    // Clear button: appears while there's a query, resets everything
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        applyFilter();
        input.focus();
      });
    }

    function applyFilter() {
      var q = input.value.toLowerCase().trim();
      var items = document.querySelectorAll(".filter-item");
      var visible = 0;

      items.forEach(function (item) {
        if (!q) {
          item.hidden = false;
          visible++;
          return;
        }
        var hay = (item.getAttribute("data-keywords") || "") + " " +
                  item.textContent.toLowerCase();
        var match = hay.indexOf(q) !== -1;
        item.hidden = !match;
        if (match) visible++;
      });

      // Hide resource cards whose items are all filtered out
      document.querySelectorAll(".card").forEach(function (card) {
        var lis = card.querySelectorAll("li.filter-item");
        if (!lis.length) return;
        var any = Array.prototype.some.call(lis, function (li) { return !li.hidden; });
        card.hidden = !any;
      });

      // Status for screen readers + sighted users
      if (status) {
        status.textContent = q
          ? (visible === 0
              ? "No results for “" + input.value.trim() + "”."
              : visible + (visible === 1 ? " result" : " results") + " for “" + input.value.trim() + "”.")
          : "";
      }
      if (noResults) noResults.hidden = !(q && visible === 0);
      if (clearBtn) clearBtn.hidden = !q;
    }
  }

  /* ---------- 3. CATEGORY FILTER CHIPS ---------- */

  function resetChips() {
    document.querySelectorAll(".chip").forEach(function (chip) {
      var isAll = chip.getAttribute("data-category") === "all";
      chip.classList.toggle("is-active", isAll);
      chip.setAttribute("aria-pressed", isAll ? "true" : "false");
    });
    // Chips only ever hide whole cards; un-hide them all
    document.querySelectorAll(".card").forEach(function (card) {
      card.hidden = false;
    });
  }

  function setUpChips() {
    var wrap = document.getElementById("filterChips");
    if (!wrap) return;
    wrap.hidden = false; // chips only appear when JS is working

    var input = document.getElementById("searchInput");
    var status = document.getElementById("searchStatus");
    var noResults = document.getElementById("noResults");

    wrap.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;

      var cat = chip.getAttribute("data-category");

      // Chips and text search are separate modes; picking a chip
      // clears any typed query so the result is unambiguous.
      if (input && input.value) {
        input.value = "";
        document.querySelectorAll(".filter-item").forEach(function (item) {
          item.hidden = false;
        });
        var clearBtn = document.getElementById("clearSearch");
        if (clearBtn) clearBtn.hidden = true;
      }
      if (noResults) noResults.hidden = true;

      wrap.querySelectorAll(".chip").forEach(function (c) {
        var active = c === chip;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", active ? "true" : "false");
      });

      var shown = 0;
      document.querySelectorAll(".card").forEach(function (card) {
        var match = cat === "all" || card.getAttribute("data-category") === cat;
        card.hidden = !match;
        if (match) shown += card.querySelectorAll("li.filter-item").length;
      });

      if (status) {
        status.textContent = cat === "all"
          ? ""
          : "Showing " + shown + (shown === 1 ? " resource" : " resources") +
            " in " + chip.textContent.trim() + ".";
      }
    });
  }

  /* ---------- 4. BACK TO TOP ---------- */

  function setUpToTop() {
    var btn = document.getElementById("toTop");
    if (!btn) return;

    function toggle() {
      btn.hidden = (window.scrollY || window.pageYOffset || 0) < 500;
    }
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();

    btn.addEventListener("click", function () {
      // CSS scroll-behavior handles smooth vs. reduced-motion instant
      window.scrollTo({ top: 0 });
      var main = document.getElementById("main");
      if (main) main.setAttribute("tabindex", "-1");
      if (main) main.focus({ preventScroll: true });
    });
  }

  /* ---------- 5. SCROLL SPY (active nav state) ---------- */

  function setUpScrollSpy() {
    var links = {
      events: document.querySelector('.site-nav a[href="#events"]'),
      resources: document.querySelector('.site-nav a[href="#resources"]'),
      connect: document.querySelector('.site-nav a[href="#connect"]')
    };
    if (!links.events && !links.resources && !links.connect) return;

    // The footer (#contact) counts as "Get Involved" territory too
    var zones = [
      { id: "events", link: links.events },
      { id: "resources", link: links.resources },
      { id: "connect", link: links.connect },
      { id: "contact", link: links.connect }
    ].filter(function (z) { return z.link && document.getElementById(z.id); });

    var ticking = false;

    function update() {
      ticking = false;
      var scrollY = window.scrollY || 0;
      var viewH = window.innerHeight || 800;

      // A section becomes "current" once its top crosses roughly the
      // upper third of the viewport (not just the very top), so short
      // sections near the bottom still get their turn.
      var offset = scrollY + Math.max(140, viewH * 0.35);
      var current = null;
      zones.forEach(function (z) {
        var el = document.getElementById(z.id);
        var top = el.getBoundingClientRect().top + scrollY;
        if (top <= offset) current = z.link;
      });

      // At (or within a few px of) the bottom of the page, the last
      // section wins no matter what: this is what makes "Get Involved"
      // light up on the newsletter/footer even though the page can't
      // scroll far enough for the threshold above.
      var doc = document.documentElement;
      if (scrollY + viewH >= doc.scrollHeight - 8) {
        current = zones[zones.length - 1].link;
      }

      // Above the first section (hero/crisis): nothing active,
      // the logo acts as "Home".
      Object.keys(links).forEach(function (k) {
        if (links[k]) links[k].classList.toggle("active", links[k] === current);
      });
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        (window.requestAnimationFrame || setTimeout)(update);
      }
    }, { passive: true });
    update();
  }

  /* ---------- 6. MOBILE MENU ---------- */

  function setUpMenu() {
    var btn = document.getElementById("menuBtn");
    var nav = document.getElementById("siteNav");
    if (!btn || !nav) return;

    document.body.classList.add("js"); // enables the CSS collapse rules
    btn.hidden = false;                // button only exists when JS works

    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Tapping a nav link closes the menu
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderEvents();
    setUpSearch();
    setUpChips();
    setUpToTop();
    setUpScrollSpy();
    setUpMenu();
  });
})();
