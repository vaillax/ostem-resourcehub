/* ============================================================
   oSTEM @ UMich — EVENTS LIST
   ============================================================
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO UPDATE EVENTS.

   HOW TO ADD AN EVENT:
   1. Copy one of the blocks between { and }, including the
      comma after the closing }.
   2. Paste it anywhere inside the square brackets [ ].
   3. Change the text. That's it — the site automatically:
        • sorts events by date (soonest first)
        • hides events once their date has passed
          (they move into a collapsed "Past events" list)

   RULES:
   • date must be written as "YYYY-MM-DD" (e.g. "2026-09-14").
   • Keep the quotes around every value.
   • time, location, description, and link are all optional —
     you can leave them as "" (empty quotes) and the site will
     simply not show that line.
   • link should be a full URL starting with https://
     (an RSVP form, Instagram post, calendar entry, etc.)

   TIP: after saving, open index.html in your browser to make
   sure your event shows up. If the whole Events section shows
   the fallback message, you probably deleted a comma or quote —
   undo your change and try again.
   ============================================================ */

window.OSTEM_EVENTS = [
  {
    title: "Pronouns 101 Workshop",
    date: "2026-09-16",
    time: "6:00–7:30 PM",
    location: "Chrysler Center, Room 133",
    description: "An open, judgment-free intro to pronouns and inclusive language in STEM spaces. Allies welcome.",
    link: ""
  },
  {
    title: "Fall Welcome Social",
    date: "2026-09-04",
    time: "5:00 PM",
    location: "The Diag (rain location: Chrysler Center)",
    description: "Snacks, games, and a chance to meet other LGBTQ+ students and allies in STEM. No RSVP needed — just show up!",
    link: ""
  },
  {
    title: "Resume & Internship Prep Night",
    date: "2026-10-01",
    time: "6:00 PM",
    location: "Duderstadt Center",
    description: "Bring your resume. Peer + alumni feedback, interview practice, and tips for finding LGBTQ+-affirming employers.",
    link: ""
  },
  /* Example of a past event — it will automatically appear
     under "Past events" instead of the main list: */
  {
    title: "Winter Study Jam",
    date: "2026-01-28",
    time: "4:00 PM",
    location: "Chrysler Center",
    description: "Co-working, coffee, and community during finals prep.",
    link: ""
  }
];
