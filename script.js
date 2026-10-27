
const $ = (selector) => document.querySelector(selector);

const STORAGE = {
  user: "or_user",
  profile: "or_profile",
  saved: "or_saved",
  tracker: "or_tracker"
};

const opportunities = [
  {
    id: "intern-1",
    title: "Frontend Development Internship",
    organization: "Internshala",
    category: "Internship",
    skills: ["html", "css", "javascript", "frontend", "web development"],
    deadline: "2026-11-15",
    url: "https://internshala.com/",
    description: "Build practical frontend development skills through project-based work."
  },
  {
    id: "hack-1",
    title: "Student Innovation Hackathon",
    organization: "Unstop",
    category: "Hackathon",
    skills: ["python", "ai", "web development", "javascript", "ui/ux", "design"],
    deadline: "2026-11-20",
    url: "https://unstop.com/",
    description: "Develop an innovative solution and demonstrate your problem-solving skills."
  },
  {
    id: "scholar-1",
    title: "Technology Student Scholarships",
    organization: "Buddy4Study",
    category: "Scholarship",
    skills: ["students", "technology", "education"],
    deadline: "2026-11-30",
    url: "https://www.buddy4study.com/",
    description: "Explore financial support opportunities for eligible students."
  },
  {
    id: "intern-2",
    title: "Web Development Learning Opportunity",
    organization: "freeCodeCamp",
    category: "Internship",
    skills: ["html", "css", "javascript", "web development"],
    deadline: "2026-12-15",
    url: "https://www.freecodecamp.org/",
    description: "Strengthen your portfolio with practical web development learning."
  },
  {
    id: "hack-2",
    title: "AI Project Challenge",
    organization: "Devpost",
    category: "Hackathon",
    skills: ["python", "ai", "machine learning", "web development"],
    deadline: "2026-12-10",
    url: "https://devpost.com/",
    description: "Explore project challenges and build solutions using technology."
  },
  {
    id: "scholar-2",
    title: "Student Funding Opportunities",
    organization: "National Scholarship Portal",
    category: "Scholarship",
    skills: ["students", "education", "technology"],
    deadline: "2026-12-20",
    url: "https://scholarships.gov.in/",
    description: "Check current scholarship schemes and their eligibility requirements."
  }
];

let currentUser = readStored(STORAGE.user, null);
let savedIds = readStored(STORAGE.saved, []);
let tracker = readStored(STORAGE.tracker, []);
let profile = readStored(STORAGE.profile, {});

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDate(dateString) {
  if (!dateString) return "Not set";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function isExpired(dateString) {
  if (!dateString) return false;
  const deadline = new Date(`${dateString}T23:59:59`);
  return deadline.getTime() < Date.now();
}

function showApp() {
  $("#loginScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");

  const name = currentUser?.name || "Student";
  $("#sidebarName").textContent = name;
  $("#sidebarAvatar").textContent = name.charAt(0).toUpperCase();

  renderOpportunities();
  renderTracker();
  fillProfile();
  updateStats();
}

$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("#loginName").value.trim();
  const email = $("#loginEmail").value.trim();

  if (!name || !email) return;

  currentUser = { name, email };
  store(STORAGE.user, currentUser);

  if (!profile.name) {
    profile.name = name;
    store(STORAGE.profile, profile);
  }

  showApp();
});

$("#signOutBtn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem(STORAGE.user);
  $("#app").classList.add("hidden");
  $("#loginScreen").classList.remove("hidden");
  $("#loginName").value = "";
  $("#loginEmail").value = "";
});

function renderOpportunities() {
  const query = $("#skillsInput").value.toLowerCase().trim();
  const category = $("#categoryFilter").value;

  const filtered = opportunities.filter((opportunity) => {
    const categoryMatch = category === "All" || opportunity.category === category;
    const text = [
      opportunity.title,
      opportunity.organization,
      opportunity.category,
      opportunity.description,
      ...opportunity.skills
    ].join(" ").toLowerCase();

    const queryMatch = !query || query.split(/[,\s]+/).filter(Boolean)
      .some((word) => text.includes(word));

    return categoryMatch && queryMatch;
  });

  const list = $("#opportunityList");

  if (!filtered.length) {
    list.innerHTML = '<p class="empty-state">No matching opportunities found. Try different skills or choose another category.</p>';
    return;
  }

  list.innerHTML = filtered.map((opportunity) => {
    const saved = savedIds.includes(opportunity.id);
    const expired = isExpired(opportunity.deadline);

    return `
      <article class="opportunity-card">
        <div class="card-top">
          <span class="category-tag">${escapeHTML(opportunity.category)}</span>
          <span class="small-note">${expired ? "Check next edition" : "Open listing"}</span>
        </div>
        <h3>${escapeHTML(opportunity.title)}</h3>
        <p>${escapeHTML(opportunity.organization)}</p>
        <p>${escapeHTML(opportunity.description)}</p>
        <div class="opportunity-meta">
          Deadline: ${formatDate(opportunity.deadline)}
        </div>
        <div class="card-actions">
          <button type="button" data-save="${opportunity.id}">${saved ? "✓ Saved" : "+ Save opportunity"}</button>
          <button type="button" data-open="${opportunity.id}">View website ↗</button>
          ${expired ? `<button type="button" data-rescue="${opportunity.id}">Find alternatives</button>` : ""}
        </div>
      </article>`;
  }).join("");
}

$("#findBtn").addEventListener("click", renderOpportunities);
$("#skillsInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") renderOpportunities();
});
$("#categoryFilter").addEventListener("change", renderOpportunities);

$("#opportunityList").addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save]");
  const openButton = event.target.closest("[data-open]");
  const rescueButton = event.target.closest("[data-rescue]");

  if (saveButton) {
    const id = saveButton.dataset.save;
    const opportunity = opportunities.find((item) => item.id === id);
    if (!opportunity) return;

    if (savedIds.includes(id)) {
      savedIds = savedIds.filter((savedId) => savedId !== id);
      tracker = tracker.filter((item) => item.id !== id);
    } else {
      savedIds.push(id);
      if (!tracker.some((item) => item.id === id)) {
        tracker.push({
          id,
          title: opportunity.title,
          organization: opportunity.organization,
          deadline: opportunity.deadline,
          status: "Interested"
        });
      }
    }

    store(STORAGE.saved, savedIds);
    store(STORAGE.tracker, tracker);
    renderOpportunities();
    renderTracker();
    updateStats();
  }

  if (openButton) {
    const opportunity = opportunities.find((item) => item.id === openButton.dataset.open);
    if (opportunity) window.open(opportunity.url, "_blank", "noopener,noreferrer");
  }

  if (rescueButton) {
    const opportunity = opportunities.find((item) => item.id === rescueButton.dataset.rescue);
    if (opportunity) {
      $("#missedOpportunity").value = opportunity.title;
      showRescueResults(opportunity.title);
      $("#rescue").scrollIntoView({ behavior: "smooth" });
    }
  }
});

function renderTracker() {
  const list = $("#trackerList");
  tracker = tracker.filter((item) => savedIds.includes(item.id));

  if (!tracker.length) {
    list.innerHTML = '<p class="empty-state">No saved opportunities yet. Go to Opportunity Radar and select “Save opportunity”.</p>';
    store(STORAGE.tracker, tracker);
    return;
  }

  list.innerHTML = tracker.map((item) => `
    <article class="tracker-item">
      <div>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.organization)} · Deadline: ${formatDate(item.deadline)}</p>
      </div>
      <select data-status="${item.id}" aria-label="Application status">
        ${["Interested", "Preparing", "Applied", "Shortlisted", "Rejected"].map((status) =>
          `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`
        ).join("")}
      </select>
      <input type="date" data-deadline="${item.id}" value="${escapeHTML(item.deadline || "")}" aria-label="Deadline">
      <button class="remove-btn" type="button" data-remove="${item.id}">Remove</button>
    </article>
  `).join("");

  store(STORAGE.tracker, tracker);
}

$("#trackerList").addEventListener("change", (event) => {
  const statusId = event.target.dataset.status;
  const deadlineId = event.target.dataset.deadline;

  if (statusId) {
    const item = tracker.find((entry) => entry.id === statusId);
    if (item) item.status = event.target.value;
  }

  if (deadlineId) {
    const item = tracker.find((entry) => entry.id === deadlineId);
    if (item) item.deadline = event.target.value;
  }

  store(STORAGE.tracker, tracker);
  updateStats();
  renderTracker();
});

$("#trackerList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;

  const id = button.dataset.remove;
  tracker = tracker.filter((item) => item.id !== id);
  savedIds = savedIds.filter((savedId) => savedId !== id);

  store(STORAGE.tracker, tracker);
  store(STORAGE.saved, savedIds);

  renderTracker();
  renderOpportunities();
  updateStats();
});

function updateStats() {
  $("#availableCount").textContent = opportunities.length;
  $("#savedCount").textContent = savedIds.length;
  $("#appliedCount").textContent = tracker.filter((item) => item.status === "Applied").length;
}

function fillProfile() {
  const fields = {
    profileName: "name",
    college: "college",
    school: "school",
    resume: "resume",
    profileSkills: "skills",
    achievements: "achievements",
    projects: "projects",
    careerGoals: "careerGoals"
  };

  Object.entries(fields).forEach(([elementId, key]) => {
    $(`#${elementId}`).value = profile[key] || "";
  });
}

$("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();

  profile = {
    name: $("#profileName").value.trim(),
    college: $("#college").value.trim(),
    school: $("#school").value.trim(),
    resume: $("#resume").value.trim(),
    skills: $("#profileSkills").value.trim(),
    achievements: $("#achievements").value.trim(),
    projects: $("#projects").value.trim(),
    careerGoals: $("#careerGoals").value.trim()
  };

  store(STORAGE.profile, profile);

  if (currentUser && profile.name) {
    currentUser.name = profile.name;
    store(STORAGE.user, currentUser);
    $("#sidebarName").textContent = currentUser.name;
    $("#sidebarAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  }

  $("#profileMessage").textContent = "Profile saved successfully!";
  setTimeout(() => {
    $("#profileMessage").textContent = "";
  }, 3000);
});

$("#rescueForm").addEventListener("submit", (event) => {
  event.preventDefault();
  showRescueResults($("#missedOpportunity").value.trim());
});

function showRescueResults(name) {
  const results = $("#rescueResults");
  const normalized = name.toLowerCase();

  const similar = opportunities.filter((item) => {
    if (item.title.toLowerCase() === normalized) return false;
    if (isExpired(item.deadline)) return false;
    return true;
  }).slice(0, 3);

  results.innerHTML = `
    <article class="rescue-tip">
      <strong>1. Check the next edition</strong>
      <p>Visit the organizer's official website to see whether another edition or application cycle is available.</p>
    </article>
    <article class="rescue-tip">
      <strong>2. Prepare for the next deadline</strong>
      <p>Update your resume, portfolio, and project links now so your next application is ready.</p>
    </article>
    <article class="rescue-tip">
      <strong>3. Explore other opportunities</strong>
      <p>These listings are alternatives to investigate. Verify their current eligibility and deadlines before applying.</p>
    </article>
    ${similar.map((item) => `
      <article class="rescue-tip">
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.organization)} · Deadline: ${formatDate(item.deadline)}</p>
        <p>${escapeHTML(item.description)}</p>
        <div class="card-actions">
          <button type="button" data-rescue-save="${item.id}">Save alternative</button>
          <button type="button" data-rescue-open="${item.id}">View website ↗</button>
        </div>
      </article>
    `).join("")}
  `;
}

$("#rescueResults").addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-rescue-save]");
  const openButton = event.target.closest("[data-rescue-open]");

  if (saveButton) {
    const id = saveButton.dataset.rescueSave;
    const opportunity = opportunities.find((item) => item.id === id);

    if (opportunity && !savedIds.includes(id)) {
      savedIds.push(id);
      tracker.push({
        id,
        title: opportunity.title,
        organization: opportunity.organization,
        deadline: opportunity.deadline,
        status: "Interested"
      });

      store(STORAGE.saved, savedIds);
      store(STORAGE.tracker, tracker);
      renderTracker();
      renderOpportunities();
      updateStats();
      saveButton.textContent = "✓ Saved";
    } else if (opportunity) {
      saveButton.textContent = "Already saved";
    }
  }

  if (openButton) {
    const opportunity = opportunities.find((item) => item.id === openButton.dataset.rescueOpen);
    if (opportunity) window.open(opportunity.url, "_blank", "noopener,noreferrer");
  }
});

function addChatMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `chat-message ${sender === "user" ? "user-message" : "bot-message"}`;
  message.textContent = text;

  $("#chatMessages").appendChild(message);
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
}

function getChatResponse(message) {
  const text = message.toLowerCase();

  if (text.includes("resume") || text.includes("cv")) {
    return "Improve your resume by highlighting relevant skills, projects, certifications, and measurable achievements. Keep the layout clear and add a working portfolio or GitHub link.";
  }

  if (text.includes("skill") || text.includes("learn")) {
    return "Start with skills related to your target role. For frontend development, focus on HTML, CSS, JavaScript, Git, responsive design, and building projects you can demonstrate.";
  }

  if (text.includes("miss") || text.includes("deadline") || text.includes("expired")) {
    return "Don't give up! Check the organizer's official page for a new edition, look for similar open opportunities, and prepare your resume and application materials for the next deadline.";
  }

  if (text.includes("project")) {
    return "Choose a problem you understand, build a small working solution, document how it works, and publish the code or demo. Explain your own contribution and the result clearly.";
  }

  if (text.includes("internship") || text.includes("apply") || text.includes("application")) {
    return "Before applying, check eligibility, deadline, required skills, location, and whether any fee is involved. Customize your resume and apply only through verified official links.";
  }

  if (text.includes("hackathon")) {
    return "For hackathons, prepare a clear problem statement, a realistic prototype, a short demo, and a concise explanation of impact. Read the official rules and submission requirements.";
  }

  if (text.includes("hello") || text.includes("hi ")) {
    return "Hi! Tell me what you want help with: resume, skills, projects, internships, hackathons, or missed deadlines.";
  }

  return "I can help with resume improvement, skill development, projects, internship applications, hackathons, and missed-deadline planning. Try asking about one of these topics.";
}

$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const input = $("#chatInput");
  const message = input.value.trim();

  if (!message) return;

  addChatMessage(message, "user");
  input.value = "";

  addChatMessage(getChatResponse(message), "bot");
});

document.querySelectorAll(".sidebar nav a").forEach((link) => {
  link.addEventListener("click", () => {
    const sectionName = link.textContent.trim();
    $("#pageTitle").textContent = sectionName.replace(/^[^\w]+/, "");
  });
});

if (currentUser) {
  showApp();
} else {
  $("#loginScreen").classList.remove("hidden");
  $("#app").classList.add("hidden");
}
