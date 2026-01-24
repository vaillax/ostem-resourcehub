function normalize(s) {
  return (s || "").toLowerCase().trim();
}

function filterResources() {
  const q = normalize(document.getElementById("searchInput").value);

  const items = document.querySelectorAll(".filter-item");
  const cards = document.querySelectorAll(".card");
  const resourceSection = document.getElementById("resources");

  // If query empty: show everything
  if (!q) {
    items.forEach(el => (el.style.display = ""));
    // also ensure containers are visible
    cards.forEach(card => (card.style.display = ""));
    if (resourceSection) resourceSection.style.display = "";
    return;
  }

  // Filter all items that have data-filter text, otherwise use visible text
  items.forEach(el => {
    const hay = normalize(el.getAttribute("data-filter")) || normalize(el.textContent);
    el.style.display = hay.includes(q) ? "" : "none";
  });

  // Hide resource cards if none of their <li> are visible
  cards.forEach(card => {
    const lis = card.querySelectorAll("li.filter-item");
    if (lis.length === 0) return; // skip cards without li items
    const anyVisible = Array.from(lis).some(li => li.style.display !== "none");
    card.style.display = anyVisible ? "" : "none";
  });
}

// button click
document.getElementById("searchBtn").addEventListener("click", filterResources);

// live typing
document.getElementById("searchInput").addEventListener("keyup", filterResources);
