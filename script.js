const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector("#site-menu");
const navLinks = document.querySelectorAll(".site-menu a");

if (menuToggle && siteMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const totalInput = document.querySelector("#totalClasses");
const attendedInput = document.querySelector("#attendedClasses");
const remainingInput = document.querySelector("#remainingClasses");
const requiredInput = document.querySelector("#requiredPercentage");
const currentAttendance = document.querySelector("#currentAttendance");
const expectedFinalAttendance = document.querySelector("#expectedFinalAttendance");
const safeBunks = document.querySelector("#safeBunks");
const recoveryPlan = document.querySelector("#recoveryPlan");
const statusCard = document.querySelector("#statusCard");
const eligibilityStatus = document.querySelector("#eligibilityStatus");
const visualIndicator = document.querySelector("#visualIndicator");
const indicatorText = document.querySelector("#indicatorText");
const copyEmailButton = document.querySelector("#copyEmail");
const copyStatus = document.querySelector("#copyStatus");
const contactEmail = "foundrystudio.dev@gmail.com";
const calculatorInputs = [totalInput, attendedInput, remainingInput, requiredInput];
const validationFields = {
  totalClasses: {
    input: totalInput,
    error: document.querySelector("#totalClassesError")
  },
  attendedClasses: {
    input: attendedInput,
    error: document.querySelector("#attendedClassesError")
  },
  remainingClasses: {
    input: remainingInput,
    error: document.querySelector("#remainingClassesError")
  },
  requiredPercentage: {
    input: requiredInput,
    error: document.querySelector("#requiredPercentageError")
  }
};

function getInputNumber(input) {
  if (!input || input.value.trim() === "") return null;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : null;
}

function getMinimumFutureAttendance(held, attended, remaining, required) {
  const semesterTotal = held + remaining;
  const requiredAttendance = Math.ceil((required / 100) * semesterTotal);
  return Math.max(0, requiredAttendance - attended);
}

function getMaximumSafeBunks(held, attended, remaining, required) {
  const minimumAttendance = getMinimumFutureAttendance(held, attended, remaining, required);
  if (minimumAttendance > remaining) return 0;
  return remaining - minimumAttendance;
}

function setStatus(status, label, message) {
  statusCard.className = `result-card status-card ${status}`;
  eligibilityStatus.textContent = label;
  indicatorText.textContent = message;

  const dotColor = status === "safe" ? "#22C55E" : status === "warning" ? "#F59E0B" : "#EF4444";
  visualIndicator.querySelector("span").style.background = dotColor;
}

function setFieldError(fieldName, message = "") {
  const field = validationFields[fieldName];
  if (!field?.input || !field?.error) return;

  field.input.classList.toggle("has-error", Boolean(message));
  field.input.setAttribute("aria-invalid", String(Boolean(message)));
  field.error.textContent = message;
}

function clearFieldErrors() {
  Object.keys(validationFields).forEach((fieldName) => setFieldError(fieldName));
}

function setResultsUnavailable(message) {
  currentAttendance.textContent = "--";
  expectedFinalAttendance.textContent = "--";
  safeBunks.textContent = "--";
  recoveryPlan.textContent = "--";
  statusCard.className = "result-card status-card risk";
  eligibilityStatus.textContent = "CHECK INPUTS";
  indicatorText.textContent = message;
  visualIndicator.querySelector("span").style.background = "#EF4444";
  document.querySelector(".result-grid")?.classList.add("is-disabled");
}

function setResultsAvailable() {
  document.querySelector(".result-grid")?.classList.remove("is-disabled");
}

function validateCalculator() {
  clearFieldErrors();

  const held = getInputNumber(totalInput);
  const attended = getInputNumber(attendedInput);
  const remaining = getInputNumber(remainingInput);
  const required = getInputNumber(requiredInput);
  const values = { held, attended, remaining, required };
  let hasError = false;

  if (Object.values(values).some((value) => value === null)) {
    if (held === null) setFieldError("totalClasses", "Enter all required values.");
    if (attended === null) setFieldError("attendedClasses", "Enter all required values.");
    if (remaining === null) setFieldError("remainingClasses", "Enter all required values.");
    if (required === null) setFieldError("requiredPercentage", "Enter all required values.");
    return { isValid: false, message: "Enter all required values.", values };
  }

  if (held < 0) {
    setFieldError("totalClasses", "Classes held cannot be negative.");
    hasError = true;
  }

  if (attended < 0) {
    setFieldError("attendedClasses", "Classes attended cannot be negative.");
    hasError = true;
  }

  if (remaining < 0) {
    setFieldError("remainingClasses", "Remaining classes cannot be negative.");
    hasError = true;
  }

  if (required < 1 || required > 100) {
    setFieldError("requiredPercentage", "Attendance percentage must be between 1 and 100.");
    hasError = true;
  }

  if (held >= 0 && attended >= 0 && attended > held) {
    setFieldError("attendedClasses", "Classes attended cannot exceed classes held.");
    hasError = true;
  }

  if (hasError) {
    return { isValid: false, message: "Correct the highlighted fields to calculate attendance.", values };
  }

  return { isValid: true, message: "", values };
}

function updateCalculator() {
  const validation = validateCalculator();

  if (!validation.isValid) {
    setResultsUnavailable(validation.message);
    return;
  }

  const { held, attended, remaining, required } = validation.values;
  const semesterTotal = held + remaining;
  const percentage = held === 0 ? 0 : (attended / held) * 100;
  const expectedFinal = semesterTotal === 0 ? 0 : ((attended + remaining) / semesterTotal) * 100;
  const minimumFutureAttendance = getMinimumFutureAttendance(held, attended, remaining, required);
  const safe = getMaximumSafeBunks(held, attended, remaining, required);
  const shortage = Math.max(0, minimumFutureAttendance - remaining);
  const finalMargin = expectedFinal - required;

  setResultsAvailable();
  currentAttendance.textContent = `${percentage.toFixed(2)}%`;
  expectedFinalAttendance.textContent = `${expectedFinal.toFixed(2)}%`;
  safeBunks.textContent = String(safe);

  if (shortage > 0) {
    recoveryPlan.textContent = `Short by ${shortage}`;
    setStatus(
      "risk",
      "NOT ELIGIBLE YET",
      `Even with perfect attendance in the remaining ${remaining} class${remaining === 1 ? "" : "es"}, you will be short by ${shortage} attended class${shortage === 1 ? "" : "es"}.`
    );
  } else if (minimumFutureAttendance === 0) {
    recoveryPlan.textContent = "Already secure";
    setStatus(
      "safe",
      "ELIGIBLE",
      `Your semester outlook is secure. You can miss all ${remaining} remaining class${remaining === 1 ? "" : "es"} and still meet the requirement.`
    );
  } else if (finalMargin < 5) {
    recoveryPlan.textContent = `Attend ${minimumFutureAttendance} of ${remaining}`;
    setStatus(
      "warning",
      "ELIGIBLE IF CAREFUL",
      `You are on track if you attend at least ${minimumFutureAttendance} of the remaining ${remaining} class${remaining === 1 ? "" : "es"}. You have ${safe} safe bunk${safe === 1 ? "" : "s"}.`
    );
  } else {
    recoveryPlan.textContent = `Attend ${minimumFutureAttendance} of ${remaining}`;
    setStatus(
      "safe",
      "LIKELY ELIGIBLE",
      `You are projected to finish above the requirement with ${safe} additional safe bunk${safe === 1 ? "" : "s"}.`
    );
  }
}

calculatorInputs.forEach((input) => {
  input.addEventListener("input", updateCalculator);
});

updateCalculator();

if (copyEmailButton && copyStatus) {
  copyEmailButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      copyStatus.textContent = `Email copied: ${contactEmail}`;
    } catch {
      copyStatus.textContent = `Email: ${contactEmail}`;
    }
  });
}

const revealTargets = document.querySelectorAll(
  "main section, .about-card, .feature-card, details, .contact-form"
);

const sections = document.querySelectorAll("main section[id]");

if (navLinks.length && sections.length) {
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { threshold: 0.45, rootMargin: "-72px 0px -42% 0px" }
  );

  sections.forEach((section) => activeObserver.observe(section));
}

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
} else {
  revealTargets.forEach((target) => target.classList.add("reveal"));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}
