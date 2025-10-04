// Filter function
function filterResources() {
  let input = document.getElementById("searchInput").value.toLowerCase();
  let sections = document.querySelectorAll("main section");

  sections.forEach(section => {
    let links = section.querySelectorAll("li");
    let matchFound = false;

    links.forEach(link => {
      let text = link.textContent.toLowerCase();
      if (text.includes(input)) {
        link.style.display = "";
        matchFound = true;
      } else {
        link.style.display = "none";
      }
    });

    // Hide section if no results
    if (!matchFound && input !== "") {
      section.style.display = "none";
    } else {
      section.style.display = "";
    }
  });
}

// Optional: filter while typing
document.getElementById("searchInput").addEventListener("keyup", filterResources);
