document.addEventListener("DOMContentLoaded", () => {
  const fadeInElements = document.querySelectorAll(".fade-in");
  const modalBackdrops = document.querySelectorAll(".modal-backdrop");
  const scrollButtons = document.querySelectorAll("[data-scroll-target]");
  const modalOpenButtons = document.querySelectorAll("[data-modal-open]");
  const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
  const bookingForm = document.getElementById("booking-form");
  const phoneInput = document.getElementById("phone");
  const vehicleSelect = document.getElementById("vehicle");
  const pickupInput = document.getElementById("pickup");
  const pickupTimeInput = document.getElementById("pickup-time");
  const dropoffInput = document.getElementById("dropoff");
  const dropoffTimeInput = document.getElementById("dropoff-time");
  const smsConsentInput = document.getElementById("sms-consent");
  const bookingRangeSummary = document.getElementById("booking-range-summary");
  const bookingRangeValue = bookingRangeSummary?.querySelector("[data-booking-range-value]") || null;
  const bookingRangeMeta = bookingRangeSummary?.querySelector("[data-booking-range-meta]") || null;
  const bookingNote = bookingForm?.querySelector(".booking-note") || null;
  const phoneErrorEl = document.getElementById("phone-error");
  const rentalDurationErrorEl = document.getElementById("rental-duration-error");
  const smsConsentErrorEl = document.getElementById("sms-consent-error");
  const smsConsentLabel = document.querySelector(".consent-option");
  const bookingSuccessModal = document.getElementById("modal-booking-success");
  const bookingSuccessCloseButton = bookingSuccessModal?.querySelector('[data-modal-close="booking-success"]') || null;
  const bookingSuccessCanvas = document.getElementById("booking-success-celebration");
  const bookingSuccessCanvasContext = bookingSuccessCanvas?.getContext("2d") || null;
  const escaladeGalleryImages = [
    "assets/images/escalade-1.jpg",
    "assets/images/escalade-2.jpg",
    "assets/images/escalade-3.jpg",
    "assets/images/escalade-4.jpg",
    "assets/images/escalade-5.jpg",
    "assets/images/escalade-6.jpg",
    "assets/images/escalade-7.jpg",
    "assets/images/escalade-8.jpg",
    "assets/images/escalade-9.jpg",
    "assets/images/escalade-10.jpg",
    "assets/images/escalade-11.jpg",
    "assets/images/escalade-12.jpg",
  ];
  const teslaGalleryImages = [
    "assets/images/Tesla-1.jpg",
    "assets/images/Tesla-2.jpg",
    "assets/images/Tesla-3.jpg",
    "assets/images/Tesla-4.jpg",
    "assets/images/Tesla-5.jpg",
    "assets/images/Tesla-6.jpg",
    "assets/images/Tesla-7.jpg",
    "assets/images/Tesla-8.jpg",
    "assets/images/Tesla-9.jpg",
    "assets/images/Tesla-10.jpg",
    "assets/images/Tesla-11.jpg",
    "assets/images/Tesla-12.jpg",
  ];
  const sharedGalleryConfigurations = {
    escalade: {
      images: escaladeGalleryImages,
      cardImageAltPrefix: "2023 Cadillac Escalade Premium Luxury Platinum photo",
      modalImageAltPrefix: "2023 Cadillac Escalade detail photo",
      cardDotAltPrefix: "View Escalade photo",
      modalDotAltPrefix: "View Escalade detail photo",
    },
    tesla: {
      images: teslaGalleryImages,
      cardImageAltPrefix: "2023 Tesla Model 3 photo",
      modalImageAltPrefix: "2023 Tesla Model 3 detail photo",
      cardDotAltPrefix: "View Tesla photo",
      modalDotAltPrefix: "View Tesla detail photo",
    },
  };
  let bookingSuccessParticles = [];
  let bookingSuccessAnimationFrame = 0;
  let bookingSuccessTimers = [];
  let bookingSuccessReturnFocusTarget = null;

  // BOOKING WEBHOOK URL: Update this if the GoHighLevel inbound webhook ever changes.
  const bookingWebhookUrl =
    "https://services.leadconnectorhq.com/hooks/VS0PZHPpr79qaZ00fQJo/webhook-trigger/2070309d-b0c7-48f5-8f8c-0550a333ab4a";

  // EXPANDED FIREWORKS/CONFETTI SETTINGS: Increase burst count, screen coverage, and total run time here.
  const bookingSuccessCelebrationSettings = {
    durationMs: 4400,
    compactViewportScale: 0.82,
    palette: ["#c9a84c", "#e2c278", "#f3ead2", "#ffffff", "#b88a34"],
    // LARGER BURST / PARTICLE SPREAD SETTINGS
    burstWaves: [
      { delayMs: 0, originRatios: [0.16, 0.5, 0.84], yRatio: 0.17, burstCount: 18, speedMin: 2.9, speedMax: 5.3, lifeMin: 92, lifeMax: 138 },
      { delayMs: 420, originRatios: [0.28, 0.72], yRatio: 0.24, burstCount: 24, speedMin: 3.1, speedMax: 5.9, lifeMin: 108, lifeMax: 156 },
      { delayMs: 980, originRatios: [0.12, 0.4, 0.6, 0.88], yRatio: 0.15, burstCount: 16, speedMin: 2.7, speedMax: 5.1, lifeMin: 94, lifeMax: 144 },
      { delayMs: 1580, originRatios: [0.22, 0.5, 0.78], yRatio: 0.28, burstCount: 22, speedMin: 2.5, speedMax: 4.8, lifeMin: 120, lifeMax: 172 },
      { delayMs: 2380, originRatios: [0.36, 0.64], yRatio: 0.2, burstCount: 20, speedMin: 2.3, speedMax: 4.4, lifeMin: 124, lifeMax: 178 },
    ],
    // INCREASED DURATION
    driftBursts: [
      { delayMs: 180, count: 22 },
      { delayMs: 760, count: 18 },
      { delayMs: 1460, count: 18 },
      { delayMs: 2280, count: 16 },
      { delayMs: 3040, count: 12 },
    ],
  };

  function getLocalDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  // PHONE INPUT AUTO-FORMAT LOGIC: Keep the visible phone number polished while preserving a clean raw digits-only version internally.
  function getPhoneDigits(value = "") {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  function formatPhoneDigits(digits = "") {
    if (!digits) {
      return "";
    }

    if (digits.length <= 3) {
      return `(${digits}`;
    }

    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  function getDigitCountBeforeCursor(value = "", cursorPosition = value.length) {
    return value.slice(0, cursorPosition).replace(/\D/g, "").length;
  }

  function getCursorPositionForDigitCount(formattedValue = "", digitCount = 0) {
    if (digitCount <= 0) {
      return 0;
    }

    let visibleDigits = 0;

    for (let index = 0; index < formattedValue.length; index += 1) {
      if (/\d/.test(formattedValue[index])) {
        visibleDigits += 1;
      }

      if (visibleDigits >= digitCount) {
        return index + 1;
      }
    }

    return formattedValue.length;
  }

  // DISPLAYED FORMATTING IS APPLIED HERE: Smoothly format typing, paste, and backspace without changing the existing phone payload key.
  function applyPhoneFormatting(input, { preserveCursor = true } = {}) {
    if (!input) {
      return "";
    }

    const currentValue = input.value;
    const rawDigits = getPhoneDigits(currentValue);
    const formattedValue = formatPhoneDigits(rawDigits);

    // RAW PHONE CLEANUP LOGIC: Store a clean 10-digit version internally for future use while keeping the current submission structure intact.
    input.dataset.rawPhone = rawDigits;

    if (currentValue === formattedValue) {
      return rawDigits;
    }

    const cursorPosition = input.selectionStart ?? currentValue.length;
    const digitsBeforeCursor = getDigitCountBeforeCursor(currentValue, cursorPosition);
    input.value = formattedValue;

    if (preserveCursor && document.activeElement === input && typeof input.setSelectionRange === "function") {
      const nextCursorPosition = getCursorPositionForDigitCount(formattedValue, digitsBeforeCursor);
      input.setSelectionRange(nextCursorPosition, nextCursorPosition);
    }

    return rawDigits;
  }

  function showFieldError(el) {
    if (el) el.hidden = false;
  }

  function hideFieldError(el) {
    if (el) el.hidden = true;
  }

  // PHONE VALIDATION: Returns true only when the raw digit count is exactly 10.
  function isPhoneValid() {
    return (phoneInput?.dataset.rawPhone || "").length === 10;
  }

  // TIME PARSING: Converts "8:00 AM" / "3:00 PM" select values to total minutes since midnight.
  function parseTimeString(value = "") {
    const match = value.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return null;
    let [, h, m, period] = match;
    h = Number(h);
    m = Number(m);
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }

  // RENTAL DURATION: Returns the rental length in milliseconds, or null if any field is missing.
  function getRentalDurationMs() {
    if (!pickupInput?.value || !dropoffInput?.value || !pickupTimeInput?.value || !dropoffTimeInput?.value) {
      return null;
    }
    const pickupDate = parseDateInputValue(pickupInput.value);
    const dropoffDate = parseDateInputValue(dropoffInput.value);
    if (!pickupDate || !dropoffDate) return null;
    const pickupMins = parseTimeString(pickupTimeInput.value);
    const dropoffMins = parseTimeString(dropoffTimeInput.value);
    if (pickupMins === null || dropoffMins === null) return null;
    return (dropoffDate.getTime() + dropoffMins * 60000) - (pickupDate.getTime() + pickupMins * 60000);
  }

  // 24-HOUR VALIDATION: Show or clear the rental duration error whenever dates or times change.
  function validateRentalDuration() {
    const durationMs = getRentalDurationMs();
    if (durationMs !== null && durationMs < 86400000) {
      showFieldError(rentalDurationErrorEl);
    } else {
      hideFieldError(rentalDurationErrorEl);
    }
  }

  const bookingDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function parseDateInputValue(value = "") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // PICKUP/DROP-OFF DATE COMPARISON LOGIC: Keep drop-off aligned with pickup and reset invalid ranges cleanly.
  function synchronizeBookingDates() {
    if (!pickupInput || !dropoffInput) {
      return;
    }

    const today = getLocalDateInputValue();
    pickupInput.min = today;
    dropoffInput.min = pickupInput.value || today;

    if (dropoffInput.value && pickupInput.value && dropoffInput.value < pickupInput.value) {
      dropoffInput.value = pickupInput.value;
    }
  }

  function hideBookingRangeSummary() {
    if (!bookingRangeSummary || !bookingRangeValue || !bookingRangeMeta) {
      return;
    }

    bookingRangeSummary.hidden = true;
    bookingRangeValue.textContent = "";
    bookingRangeMeta.textContent = "";
  }

  // RENTAL DATE RANGE LOGIC: Native range highlighting is unreliable on iPhone, so this premium fallback shows the selected booking window.
  function updateBookingRangeSummary() {
    if (!pickupInput || !dropoffInput || !bookingRangeSummary || !bookingRangeValue || !bookingRangeMeta) {
      return;
    }

    const pickupDate = parseDateInputValue(pickupInput.value);
    const dropoffDate = parseDateInputValue(dropoffInput.value);

    if (!pickupDate || !dropoffDate) {
      hideBookingRangeSummary();
      return;
    }

    const rentalDays = Math.round((dropoffDate.getTime() - pickupDate.getTime()) / 86400000);

    if (rentalDays < 0) {
      hideBookingRangeSummary();
      return;
    }

    // HIGHLIGHTED/FALLBACK BOOKING RANGE DISPLAY LOGIC
    bookingRangeValue.textContent = `${bookingDateFormatter.format(pickupDate)} - ${bookingDateFormatter.format(dropoffDate)}`;
    bookingRangeMeta.textContent = rentalDays === 0 ? "Same-day rental window" : `${rentalDays}-day rental window`;
    bookingRangeSummary.hidden = false;
  }

  if (phoneInput) {
    applyPhoneFormatting(phoneInput, { preserveCursor: false });
    phoneInput.addEventListener("input", () => {
      applyPhoneFormatting(phoneInput);
      if (isPhoneValid()) {
        hideFieldError(phoneErrorEl);
      }
    });
    phoneInput.addEventListener("blur", () => {
      const digits = phoneInput.dataset.rawPhone || "";
      if (digits.length > 0 && !isPhoneValid()) {
        showFieldError(phoneErrorEl);
      }
    });
  }

  if (smsConsentInput) {
    smsConsentInput.addEventListener("change", () => {
      if (smsConsentInput.checked) {
        hideFieldError(smsConsentErrorEl);
        smsConsentLabel?.classList.remove("consent-invalid");
      }
    });
  }

  function resizeBookingSuccessCanvas() {
    if (!bookingSuccessCanvas || !bookingSuccessCanvasContext) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    bookingSuccessCanvas.width = Math.floor(viewportWidth * pixelRatio);
    bookingSuccessCanvas.height = Math.floor(viewportHeight * pixelRatio);
    bookingSuccessCanvas.style.width = `${viewportWidth}px`;
    bookingSuccessCanvas.style.height = `${viewportHeight}px`;
    bookingSuccessCanvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function stopBookingSuccessCelebration() {
    if (bookingSuccessAnimationFrame) {
      window.cancelAnimationFrame(bookingSuccessAnimationFrame);
      bookingSuccessAnimationFrame = 0;
    }

    bookingSuccessTimers.forEach((timerId) => window.clearTimeout(timerId));
    bookingSuccessTimers = [];

    bookingSuccessParticles = [];

    if (bookingSuccessCanvasContext && bookingSuccessCanvas) {
      bookingSuccessCanvasContext.clearRect(0, 0, bookingSuccessCanvas.clientWidth || 0, bookingSuccessCanvas.clientHeight || 0);
    }
  }

  function drawBookingSuccessParticle(particle) {
    if (!bookingSuccessCanvasContext) {
      return;
    }

    bookingSuccessCanvasContext.save();
    bookingSuccessCanvasContext.translate(particle.x, particle.y);
    bookingSuccessCanvasContext.rotate(particle.rotation);
    bookingSuccessCanvasContext.globalAlpha = Math.max(particle.life / particle.maxLife, 0) * 0.92;
    bookingSuccessCanvasContext.fillStyle = particle.color;

    if (particle.shape === "rect") {
      bookingSuccessCanvasContext.fillRect(-particle.size * 0.65, -particle.size * 0.22, particle.size * 1.3, particle.size * 0.44);
    } else {
      bookingSuccessCanvasContext.beginPath();
      bookingSuccessCanvasContext.arc(0, 0, particle.size, 0, Math.PI * 2);
      bookingSuccessCanvasContext.fill();
    }

    bookingSuccessCanvasContext.restore();
  }

  function queueBookingSuccessTimer(callback, delayMs) {
    const timerId = window.setTimeout(() => {
      bookingSuccessTimers = bookingSuccessTimers.filter((queuedTimerId) => queuedTimerId !== timerId);
      callback();
    }, delayMs);

    bookingSuccessTimers.push(timerId);
  }

  function spawnBookingSuccessBurst(originX, originY, waveConfig, intensityScale) {
    const particleCount = Math.max(10, Math.round(waveConfig.burstCount * intensityScale));

    for (let index = 0; index < particleCount; index += 1) {
      const shape = Math.random() > 0.46 ? "rect" : "circle";
      const maxLife = randomBetween(waveConfig.lifeMin, waveConfig.lifeMax);
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(waveConfig.speedMin, waveConfig.speedMax);

      bookingSuccessParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(0.2, 0.9),
        gravity: randomBetween(0.013, 0.03),
        drag: randomBetween(0.976, 0.989),
        life: maxLife,
        maxLife,
        size: shape === "rect" ? randomBetween(5.2, 8.8) : randomBetween(2.3, 4.1),
        rotation: randomBetween(0, Math.PI * 2),
        spin: randomBetween(-0.14, 0.14),
        color:
          bookingSuccessCelebrationSettings.palette[
            Math.floor(Math.random() * bookingSuccessCelebrationSettings.palette.length)
          ],
        shape,
      });
    }
  }

  function spawnBookingSuccessDrift(viewportWidth, viewportHeight, driftConfig, intensityScale) {
    const particleCount = Math.max(8, Math.round(driftConfig.count * intensityScale));

    for (let index = 0; index < particleCount; index += 1) {
      const maxLife = randomBetween(126, 188);

      bookingSuccessParticles.push({
        x: randomBetween(viewportWidth * 0.08, viewportWidth * 0.92),
        y: randomBetween(-24, viewportHeight * 0.12),
        vx: randomBetween(-0.65, 0.65),
        vy: randomBetween(1.25, 2.95),
        gravity: randomBetween(0.006, 0.015),
        drag: randomBetween(0.989, 0.996),
        life: maxLife,
        maxLife,
        size: randomBetween(5.4, 9.6),
        rotation: randomBetween(0, Math.PI * 2),
        spin: randomBetween(-0.12, 0.12),
        color:
          bookingSuccessCelebrationSettings.palette[
            Math.floor(Math.random() * bookingSuccessCelebrationSettings.palette.length)
          ],
        shape: Math.random() > 0.3 ? "rect" : "circle",
      });
    }
  }

  // FIREWORKS/CONFETTI SUCCESS EFFECT: Lightweight gold-and-white celebration that runs only after a confirmed successful submission.
  function playBookingSuccessCelebration() {
    if (
      !bookingSuccessCanvas ||
      !bookingSuccessCanvasContext ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      return;
    }

    stopBookingSuccessCelebration();
    resizeBookingSuccessCanvas();

    const viewportWidth = bookingSuccessCanvas.clientWidth || window.innerWidth;
    const viewportHeight = bookingSuccessCanvas.clientHeight || window.innerHeight;
    const intensityScale = viewportWidth < 640 ? bookingSuccessCelebrationSettings.compactViewportScale : 1;
    const celebrationStartedAt = performance.now();
    let previousFrameTime = performance.now();

    bookingSuccessParticles = [];

    bookingSuccessCelebrationSettings.burstWaves.forEach((waveConfig) => {
      queueBookingSuccessTimer(() => {
        waveConfig.originRatios.forEach((originRatio) => {
          const originX = viewportWidth * originRatio + randomBetween(-viewportWidth * 0.035, viewportWidth * 0.035);
          const originY = Math.min(
            viewportHeight * waveConfig.yRatio + randomBetween(-18, 18),
            viewportHeight * 0.34,
          );

          spawnBookingSuccessBurst(originX, originY, waveConfig, intensityScale);
        });
      }, waveConfig.delayMs);
    });

    bookingSuccessCelebrationSettings.driftBursts.forEach((driftConfig) => {
      queueBookingSuccessTimer(() => {
        spawnBookingSuccessDrift(viewportWidth, viewportHeight, driftConfig, intensityScale);
      }, driftConfig.delayMs);
    });

    function animateBookingSuccessCelebration(currentTime) {
      const delta = Math.min((currentTime - previousFrameTime) / 16.6667, 1.7);
      const elapsedMs = currentTime - celebrationStartedAt;
      previousFrameTime = currentTime;

      bookingSuccessCanvasContext.clearRect(0, 0, viewportWidth, viewportHeight);

      bookingSuccessParticles = bookingSuccessParticles.filter((particle) => {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vx *= particle.drag;
        particle.vy = particle.vy * particle.drag + particle.gravity * delta;
        particle.rotation += particle.spin * delta;
        particle.life -= delta;

        if (particle.life <= 0 || particle.y > viewportHeight + 28) {
          return false;
        }

        drawBookingSuccessParticle(particle);
        return true;
      });

      const celebrationHasCompleted =
        elapsedMs >= bookingSuccessCelebrationSettings.durationMs && bookingSuccessTimers.length === 0;

      if (bookingSuccessParticles.length === 0 && celebrationHasCompleted) {
        stopBookingSuccessCelebration();
        return;
      }

      bookingSuccessAnimationFrame = window.requestAnimationFrame(animateBookingSuccessCelebration);
    }

    bookingSuccessAnimationFrame = window.requestAnimationFrame(animateBookingSuccessCelebration);
  }

  function handleBookingSuccessModalClosed() {
    stopBookingSuccessCelebration();

    if (
      bookingSuccessReturnFocusTarget &&
      typeof bookingSuccessReturnFocusTarget.focus === "function" &&
      !bookingSuccessReturnFocusTarget.hasAttribute("disabled")
    ) {
      bookingSuccessReturnFocusTarget.focus({ preventScroll: true });
    }

    bookingSuccessReturnFocusTarget = null;
  }

  function closeAllModals() {
    const bookingSuccessWasOpen = Boolean(bookingSuccessModal?.classList.contains("open"));
    modalBackdrops.forEach((modal) => modal.classList.remove("open"));
    document.body.style.overflow = "";

    if (bookingSuccessWasOpen) {
      handleBookingSuccessModalClosed();
    }
  }

  function openModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (!modal) {
      return;
    }

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModalElement(modal) {
    if (!modal) {
      return;
    }

    const isBookingSuccessModal = modal === bookingSuccessModal;
    modal.classList.remove("open");
    document.body.style.overflow = "";

    if (isBookingSuccessModal) {
      handleBookingSuccessModalClosed();
    }
  }

  // SUCCESS MODAL OPEN/CLOSE BEHAVIOR: Move focus into the success popup when it opens and allow clean dismissal by button, overlay, or Escape.
  function openBookingSuccessModal() {
    if (!bookingSuccessModal) {
      return;
    }

    bookingSuccessReturnFocusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openModal("booking-success");

    window.requestAnimationFrame(() => {
      bookingSuccessCloseButton?.focus({ preventScroll: true });
    });
  }

  function scrollToSection(sectionId, vehicleId = "") {
    closeAllModals();

    if (vehicleId && vehicleSelect) {
      vehicleSelect.value = vehicleId;
    }

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth" });
  }

  // SHARED SLIDESHOW LOGIC: Handles auto-rotation, arrow controls, and dot controls for the Escalade and Tesla galleries.
  function initializeSharedSlideshows() {
    const sharedSlideshows = document.querySelectorAll("[data-shared-gallery]");

    sharedSlideshows.forEach((slideshow) => {
      const galleryKey = slideshow.dataset.sharedGallery || "";
      const galleryConfig = sharedGalleryConfigurations[galleryKey];

      if (!galleryConfig) {
        return;
      }

      const controls = slideshow.querySelector(".slideshow-controls");
      const dotsContainer = slideshow.querySelector(".slideshow-dots");
      const galleryType = slideshow.dataset[`${galleryKey}Gallery`] === "modal" ? "modal" : "card";
      const imageAltPrefix = galleryType === "modal" ? galleryConfig.modalImageAltPrefix : galleryConfig.cardImageAltPrefix;
      const dotAltPrefix = galleryType === "modal" ? galleryConfig.modalDotAltPrefix : galleryConfig.cardDotAltPrefix;
      const slideClassName = galleryType === "modal" ? "slideshow-image modal-img" : "slideshow-image";
      const slideInsertionTarget = controls || dotsContainer || null;
      const slideMarkup = document.createDocumentFragment();
      const dotMarkup = document.createDocumentFragment();

      slideshow.querySelectorAll(".slideshow-image").forEach((slide) => slide.remove());
      dotsContainer?.replaceChildren();

      galleryConfig.images.forEach((imagePath, index) => {
        const image = document.createElement("img");
        const dot = document.createElement("button");
        const isFirstImage = index === 0;

        image.src = imagePath;
        image.alt = `${imageAltPrefix} ${index + 1}`;
        image.className = isFirstImage ? `${slideClassName} is-active` : slideClassName;
        image.loading = isFirstImage ? "eager" : "lazy";

        if (galleryType === "card" && isFirstImage) {
          image.fetchPriority = "high";
        }

        dot.type = "button";
        dot.className = isFirstImage ? "slideshow-dot is-active" : "slideshow-dot";
        dot.dataset.slideshowDot = String(index);
        dot.setAttribute("aria-label", `${dotAltPrefix} ${index + 1}`);
        dot.setAttribute("aria-pressed", String(isFirstImage));

        slideMarkup.append(image);
        dotMarkup.append(dot);
      });

      slideshow.insertBefore(slideMarkup, slideInsertionTarget);
      dotsContainer?.append(dotMarkup);
    });
  }

  function initializeSlideshows() {
    const slideshows = document.querySelectorAll("[data-slideshow]");

    slideshows.forEach((slideshow) => {
      const slides = Array.from(slideshow.querySelectorAll(".slideshow-image"));
      const dots = Array.from(slideshow.querySelectorAll("[data-slideshow-dot]"));
      const previousButton = slideshow.querySelector("[data-slideshow-prev]");
      const nextButton = slideshow.querySelector("[data-slideshow-next]");
      const intervalMs = Number(slideshow.dataset.interval) || 2800;
      let rotationId = null;

      if (slides.length <= 1) {
        return;
      }

      let activeIndex = 0;

      function updateActiveStates(nextIndex) {
        activeIndex = (nextIndex + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
          slide.classList.toggle("is-active", slideIndex === activeIndex);
        });

        dots.forEach((dot, dotIndex) => {
          const isActive = dotIndex === activeIndex;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-pressed", String(isActive));
        });
      }

      function startRotation() {
        if (rotationId) {
          window.clearInterval(rotationId);
        }

        rotationId = window.setInterval(() => {
          updateActiveStates(activeIndex + 1);
        }, intervalMs);
      }

      function handleManualNavigation(nextIndex) {
        updateActiveStates(nextIndex);
        startRotation();
      }

      previousButton?.addEventListener("click", () => {
        handleManualNavigation(activeIndex - 1);
      });

      nextButton?.addEventListener("click", () => {
        handleManualNavigation(activeIndex + 1);
      });

      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          handleManualNavigation(Number(dot.dataset.slideshowDot));
        });
      });

      updateActiveStates(0);
      startRotation();
    });
  }

  // TESTIMONIAL CAROUSEL SETTINGS: Change autoplay speed, transition timing, and cards shown on desktop/tablet/mobile here.
  const testimonialCarouselSettings = {
    autoplaySpeed: 4000,
    transitionDuration: 700,
    swipeThreshold: 56,
    dragIntentThreshold: 14,
    cardsVisible: {
      desktop: 3,
      tablet: 2,
      mobile: 1,
    },
    breakpoints: {
      tablet: 768,
      desktop: 1024,
    },
  };

  function initializeTestimonialCarousels(settings) {
    const carousels = document.querySelectorAll("[data-testimonial-carousel]");

    carousels.forEach((carousel) => {
      const viewport = carousel.querySelector("[data-testimonial-viewport]");
      const track = carousel.querySelector("[data-testimonial-track]");
      const dotsContainer = carousel.querySelector("[data-testimonial-dots]");
      const originalSlides = Array.from(track?.querySelectorAll("[data-testimonial-slide]") || []);

      if (!viewport || !track || !dotsContainer || originalSlides.length === 0) {
        return;
      }

      const totalSlides = originalSlides.length;
      const cloneBuffer = Math.min(
        Math.max(settings.cardsVisible.desktop, settings.cardsVisible.tablet, settings.cardsVisible.mobile),
        totalSlides,
      );

      let cardsVisible = settings.cardsVisible.mobile;
      let currentIndex = cloneBuffer;
      let slideWidth = 0;
      let trackGap = 0;
      let autoplayId = 0;
      let resizeFrame = 0;
      let isDragging = false;
      let isHovered = false;
      let isFocused = false;
      let isTransitioning = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let dragDeltaX = 0;
      let hasHorizontalDragIntent = false;
      let activePointerId = null;

      function createClone(slide) {
        const clone = slide.cloneNode(true);
        clone.dataset.testimonialClone = "true";
        clone.removeAttribute("data-testimonial-slide");
        clone.setAttribute("aria-hidden", "true");
        return clone;
      }

      originalSlides
        .slice(-cloneBuffer)
        .reverse()
        .forEach((slide) => {
          track.insertBefore(createClone(slide), track.firstChild);
        });

      originalSlides.slice(0, cloneBuffer).forEach((slide) => {
        track.appendChild(createClone(slide));
      });

      // TESTIMONIAL DOTS: Change dot count by adding or removing cards in index.html; dots are rebuilt automatically.
      const dots = originalSlides.map((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "testimonial-dot";
        dot.dataset.testimonialDot = String(index);
        dot.setAttribute("aria-label", `View testimonial ${index + 1}`);
        dot.setAttribute("aria-pressed", "false");
        dotsContainer.appendChild(dot);
        return dot;
      });

      function getCardsVisible() {
        if (window.innerWidth >= settings.breakpoints.desktop) {
          return settings.cardsVisible.desktop;
        }

        if (window.innerWidth >= settings.breakpoints.tablet) {
          return settings.cardsVisible.tablet;
        }

        return settings.cardsVisible.mobile;
      }

      function getLogicalIndex(index = currentIndex) {
        return ((index - cloneBuffer) % totalSlides + totalSlides) % totalSlides;
      }

      function getOffsetForIndex(index = currentIndex) {
        return (slideWidth + trackGap) * index;
      }

      function setTrackTransition(isEnabled) {
        track.style.transition = isEnabled
          ? `transform ${settings.transitionDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`
          : "none";
      }

      function updateDots() {
        const logicalIndex = getLogicalIndex();

        dots.forEach((dot, index) => {
          const isActive = index === logicalIndex;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-pressed", String(isActive));
        });
      }

      function measure() {
        carousel.style.setProperty("--testimonial-cards-visible", String(cardsVisible));

        const firstSlide = track.querySelector(".testimonial-slide");

        if (!firstSlide) {
          return;
        }

        slideWidth = firstSlide.getBoundingClientRect().width;

        const computedTrackStyles = window.getComputedStyle(track);
        trackGap = parseFloat(computedTrackStyles.columnGap || computedTrackStyles.gap || "0");
      }

      function getMaxOriginalStartIndex() {
        return cloneBuffer + totalSlides - cardsVisible;
      }

      function forceTrackReflow() {
        void track.getBoundingClientRect();
      }

      function updatePosition({ animated = true } = {}) {
        setTrackTransition(animated);
        track.style.transform = `translate3d(${-getOffsetForIndex(currentIndex)}px, 0, 0)`;
      }

      function clearAutoplay() {
        if (!autoplayId) {
          return;
        }

        window.clearInterval(autoplayId);
        autoplayId = 0;
      }

      function startAutoplay() {
        clearAutoplay();

        if (totalSlides <= cardsVisible || isHovered || isFocused) {
          return;
        }

        autoplayId = window.setInterval(() => {
          if (isDragging || isTransitioning) {
            return;
          }

          stepCarousel(1, { restartAutoplay: false });
        }, settings.autoplaySpeed);
      }

      function goToIndex(nextIndex, { animated = true, restartAutoplay = true } = {}) {
        if (animated && isTransitioning) {
          return;
        }

        currentIndex = nextIndex;
        isTransitioning = animated;
        updatePosition({ animated });
        updateDots();

        if (restartAutoplay) {
          startAutoplay();
        }
      }

      function normalizeIndex() {
        if (currentIndex >= totalSlides + cloneBuffer) {
          currentIndex -= totalSlides;
          updatePosition({ animated: false });
        } else if (currentIndex < cloneBuffer) {
          currentIndex += totalSlides;
          updatePosition({ animated: false });
        }

        isTransitioning = false;
      }

      function getClosestIndex(targetLogicalIndex) {
        const baseIndex = cloneBuffer + targetLogicalIndex;
        const candidates = [baseIndex, baseIndex - totalSlides, baseIndex + totalSlides];

        return candidates.reduce((closestIndex, candidate) => {
          return Math.abs(candidate - currentIndex) < Math.abs(closestIndex - currentIndex) ? candidate : closestIndex;
        }, baseIndex);
      }

      function handleManualNavigation(nextIndex, animated = true) {
        goToIndex(nextIndex, { animated, restartAutoplay: true });
      }

      function wrapToStart({ restartAutoplay = true } = {}) {
        currentIndex = cloneBuffer - cardsVisible;
        updatePosition({ animated: false });
        forceTrackReflow();

        currentIndex = cloneBuffer;
        isTransitioning = true;
        updatePosition({ animated: true });
        updateDots();

        if (restartAutoplay) {
          startAutoplay();
        }
      }

      function wrapToEnd({ restartAutoplay = true } = {}) {
        currentIndex = cloneBuffer + totalSlides;
        updatePosition({ animated: false });
        forceTrackReflow();

        currentIndex = getMaxOriginalStartIndex();
        isTransitioning = true;
        updatePosition({ animated: true });
        updateDots();

        if (restartAutoplay) {
          startAutoplay();
        }
      }

      function stepCarousel(direction, { restartAutoplay = true } = {}) {
        if (direction > 0 && currentIndex >= getMaxOriginalStartIndex()) {
          wrapToStart({ restartAutoplay });
          return;
        }

        if (direction < 0 && currentIndex <= cloneBuffer) {
          wrapToEnd({ restartAutoplay });
          return;
        }

        goToIndex(currentIndex + direction, { animated: true, restartAutoplay });
      }

      function resetDragState() {
        viewport.classList.remove("is-dragging");
        isDragging = false;
        hasHorizontalDragIntent = false;
        dragDeltaX = 0;
        activePointerId = null;
      }

      function cancelDrag(pointerId) {
        if (!isDragging) {
          return;
        }

        if (typeof pointerId === "number" && viewport.hasPointerCapture?.(pointerId)) {
          viewport.releasePointerCapture(pointerId);
        }

        if (hasHorizontalDragIntent) {
          goToIndex(currentIndex, { animated: true, restartAutoplay: true });
        }

        resetDragState();
        startAutoplay();
      }

      function finishDrag(pointerId) {
        if (!isDragging) {
          return;
        }

        if (typeof pointerId === "number" && viewport.hasPointerCapture?.(pointerId)) {
          viewport.releasePointerCapture(pointerId);
        }

        if (!hasHorizontalDragIntent) {
          resetDragState();
          startAutoplay();
          return;
        }

        // SWIPE THRESHOLD LOGIC TO AVOID ACCIDENTAL TRIGGERS
        const swipeThreshold = Math.max(settings.swipeThreshold, slideWidth * 0.12);

        if (Math.abs(dragDeltaX) > swipeThreshold) {
          stepCarousel(dragDeltaX < 0 ? 1 : -1, { restartAutoplay: true });
        } else {
          goToIndex(currentIndex, { animated: true, restartAutoplay: true });
        }

        resetDragState();
      }

      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const targetIndex = Number(dot.dataset.testimonialDot);
          const closestIndex = getClosestIndex(targetIndex);
          const shouldAnimate = Math.abs(closestIndex - currentIndex) <= cardsVisible;
          handleManualNavigation(closestIndex, shouldAnimate);
        });
      });

      track.addEventListener("transitionend", (event) => {
        if (event.target !== track || event.propertyName !== "transform") {
          return;
        }

        normalizeIndex();
      });

      // TESTIMONIAL SWIPE SUPPORT
      // TOUCH START LOGIC: Wait for a clearly horizontal gesture before locking the carousel into a swipe.
      viewport.addEventListener("pointerdown", (event) => {
        if ((event.pointerType === "mouse" && event.button !== 0) || isTransitioning) {
          return;
        }

        if (event.pointerType === "mouse") {
          event.preventDefault();
        }

        activePointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragDeltaX = 0;
        isDragging = true;
        hasHorizontalDragIntent = event.pointerType === "mouse";

        if (hasHorizontalDragIntent) {
          viewport.classList.add("is-dragging");
          clearAutoplay();
          setTrackTransition(false);
          viewport.setPointerCapture?.(event.pointerId);
        }
      });

      // TOUCH MOVE LOGIC: Only treat the gesture as a swipe once sideways movement clearly wins over vertical scrolling.
      viewport.addEventListener("pointermove", (event) => {
        if (!isDragging || event.pointerId !== activePointerId) {
          return;
        }

        const nextDragDeltaX = event.clientX - dragStartX;
        const dragDeltaY = event.clientY - dragStartY;

        if (!hasHorizontalDragIntent) {
          const gestureThreshold = settings.dragIntentThreshold;

          if (Math.abs(nextDragDeltaX) < gestureThreshold && Math.abs(dragDeltaY) < gestureThreshold) {
            return;
          }

          if (Math.abs(dragDeltaY) > Math.abs(nextDragDeltaX)) {
            cancelDrag(event.pointerId);
            return;
          }

          hasHorizontalDragIntent = true;
          viewport.classList.add("is-dragging");
          clearAutoplay();
          setTrackTransition(false);
          viewport.setPointerCapture?.(event.pointerId);
        }

        if (event.cancelable) {
          event.preventDefault();
        }

        dragDeltaX = nextDragDeltaX;
        track.style.transform = `translate3d(${-getOffsetForIndex(currentIndex) + dragDeltaX}px, 0, 0)`;
      });

      // TOUCH END LOGIC
      viewport.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId) {
          return;
        }

        finishDrag(event.pointerId);
      });

      viewport.addEventListener("pointercancel", (event) => {
        if (event.pointerId !== activePointerId) {
          return;
        }

        cancelDrag(event.pointerId);
      });

      carousel.addEventListener("mouseenter", () => {
        isHovered = true;
        clearAutoplay();
      });

      carousel.addEventListener("mouseleave", () => {
        isHovered = false;
        startAutoplay();
      });

      carousel.addEventListener("focusin", () => {
        isFocused = true;
        clearAutoplay();
      });

      carousel.addEventListener("focusout", (event) => {
        if (event.relatedTarget && carousel.contains(event.relatedTarget)) {
          return;
        }

        isFocused = false;
        startAutoplay();
      });

      window.addEventListener("resize", () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
          const activeLogicalIndex = getLogicalIndex();
          cardsVisible = Math.min(getCardsVisible(), totalSlides);
          measure();
          currentIndex = Math.min(cloneBuffer + activeLogicalIndex, getMaxOriginalStartIndex());
          updatePosition({ animated: false });
          updateDots();
          startAutoplay();
        });
      });

      carousel.classList.add("is-ready");
      cardsVisible = Math.min(getCardsVisible(), totalSlides);
      measure();
      updateDots();
      updatePosition({ animated: false });
      startAutoplay();
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) {
            return;
          }

          window.setTimeout(() => {
            entry.target.classList.add("visible");
          }, index * 80);

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );

    fadeInElements.forEach((element) => observer.observe(element));
  } else {
    fadeInElements.forEach((element) => element.classList.add("visible"));
  }

  initializeSharedSlideshows();
  initializeSlideshows();
  initializeTestimonialCarousels(testimonialCarouselSettings);

  scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
      scrollToSection(button.dataset.scrollTarget, button.dataset.vehicle || "");
    });
  });

  modalOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openModal(button.dataset.modalOpen);
    });
  });

  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.dataset.modalClose;
      const modal = document.getElementById(`modal-${modalId}`);
      closeModalElement(modal);
    });
  });

  modalBackdrops.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      closeModalElement(modal);
    });
  });

  window.addEventListener("resize", () => {
    if (bookingSuccessModal?.classList.contains("open")) {
      resizeBookingSuccessCanvas();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });

  // BOOKING FORM: Update submit messaging, field mapping, or webhook behavior here.
  if (bookingForm) {
    const submitButton = bookingForm.querySelector('button[type="submit"]');
    const defaultButtonLabel = submitButton?.textContent || "Submit Reservation Request";
    const defaultBookingNote = bookingNote?.textContent || "";
    let bookingMessageTimeout = 0;

    bookingNote?.setAttribute("aria-live", "polite");
    bookingNote?.setAttribute("role", "status");

    function clearBookingMessageTimeout() {
      if (!bookingMessageTimeout) {
        return;
      }

      window.clearTimeout(bookingMessageTimeout);
      bookingMessageTimeout = 0;
    }

    function resetBookingFormState() {
      if (!submitButton) {
        return;
      }

      submitButton.textContent = defaultButtonLabel;
      submitButton.style.background = "";
      submitButton.disabled = false;

      if (bookingNote) {
        bookingNote.textContent = defaultBookingNote;
      }
    }

    // SUCCESS AND ERROR HANDLING: Temporary user feedback is controlled in this helper.
    function showBookingMessage(message, { isSuccess = false, resetForm = false, duration = 4000 } = {}) {
      if (!submitButton) {
        return;
      }

      clearBookingMessageTimeout();

      submitButton.textContent = isSuccess ? "\u2713 Request Sent!" : defaultButtonLabel;
      submitButton.style.background = isSuccess ? "#2d7a3a" : "";
      submitButton.disabled = !isSuccess ? false : true;

      if (bookingNote) {
        bookingNote.textContent = message;
      }

      bookingMessageTimeout = window.setTimeout(() => {
        if (resetForm) {
          bookingForm.reset();
          if (phoneInput) {
            phoneInput.dataset.rawPhone = "";
          }
          synchronizeBookingDates();
          updateBookingRangeSummary();
        }

        resetBookingFormState();
      }, duration);
    }

    bookingForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!submitButton) {
        return;
      }

      // PHONE VALIDATION: Require a complete 10-digit number before sending.
      if (!isPhoneValid()) {
        showFieldError(phoneErrorEl);
        phoneInput?.focus();
        return;
      }

      // 24-HOUR MINIMUM RENTAL VALIDATION: Block same-day or sub-24h bookings.
      const durationMs = getRentalDurationMs();
      if (durationMs !== null && durationMs < 86400000) {
        showFieldError(rentalDurationErrorEl);
        dropoffInput?.focus();
        return;
      }

      // SMS CONSENT VALIDATION: Require the checkbox before submitting.
      if (!smsConsentInput?.checked) {
        showFieldError(smsConsentErrorEl);
        smsConsentLabel?.classList.add("consent-invalid");
        smsConsentInput?.focus();
        return;
      }

      clearBookingMessageTimeout();
      submitButton.textContent = "Sending...";
      submitButton.style.background = "";
      submitButton.disabled = true;

      if (bookingNote) {
        bookingNote.textContent = "Sending your reservation request...";
      }

      // FIELD MAPPING: These keys are sent to GoHighLevel exactly as requested.
      const payload = {
        fullName: document.getElementById("name")?.value.trim() || "",
        phone: document.getElementById("phone")?.value.trim() || "",
        vehicleChoice: vehicleSelect?.options[vehicleSelect.selectedIndex]?.text || vehicleSelect?.value || "",
        pickupDate: pickupInput?.value || "",
        // WEBHOOK TIME VALUE PRESERVATION: pickupTime/dropoffTime keys stay exactly the same for GoHighLevel.
        pickupTime: pickupTimeInput?.value || "",
        dropoffDate: dropoffInput?.value || "",
        dropoffTime: dropoffTimeInput?.value || "",
        // WEBHOOK PAYLOAD SMS CONSENT FIELD
        smsConsent: Boolean(smsConsentInput?.checked),
      };

      try {
        const response = await fetch(bookingWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let responseData = responseText;

        try {
          responseData = responseText ? JSON.parse(responseText) : null;
        } catch {
          responseData = responseText;
        }

        console.log("Fox's Fleet booking webhook response", {
          ok: response.ok,
          status: response.status,
          data: responseData,
        });

        if (!response.ok) {
          throw new Error(`Webhook request failed with status ${response.status}`);
        }

        showBookingMessage("Reservation request received. We'll be in touch shortly.", {
          isSuccess: true,
          resetForm: true,
          duration: 4000,
        });
        // META PIXEL: Fire Lead event only after the webhook confirms a successful submission.
        if (typeof fbq === "function") {
          fbq("track", "Lead");
        }
        // GA4: Fire generate_lead conversion only after the webhook confirms a successful submission.
        if (typeof gtag === "function") {
          gtag("event", "generate_lead");
        }
        // SUCCESSFUL SUBMISSION POPUP LOGIC: Open the luxury success modal and launch the celebration only after the webhook confirms success.
        openBookingSuccessModal();
        playBookingSuccessCelebration();
      } catch (error) {
        console.error("Fox's Fleet booking webhook error", error);
        showBookingMessage("We couldn't send your request. Please try again or call/text us directly.", {
          isSuccess: false,
          resetForm: false,
          duration: 5000,
        });
      }
    });
  }

  if (pickupInput && dropoffInput) {
    synchronizeBookingDates();
    updateBookingRangeSummary();

    const handleBookingDateChange = () => {
      synchronizeBookingDates();
      updateBookingRangeSummary();
      validateRentalDuration();
    };

    pickupInput.addEventListener("change", handleBookingDateChange);
    pickupInput.addEventListener("input", handleBookingDateChange);
    dropoffInput.addEventListener("change", handleBookingDateChange);
    dropoffInput.addEventListener("input", handleBookingDateChange);

    pickupTimeInput?.addEventListener("change", validateRentalDuration);
    dropoffTimeInput?.addEventListener("change", validateRentalDuration);
  }

  // NAVBAR: Scroll-aware glass effect + mobile drawer.
  const siteNav = document.getElementById("site-nav");
  const navHamburger = document.getElementById("nav-hamburger");
  const navDrawer = document.getElementById("nav-drawer");
  const navDrawerLinks = navDrawer ? Array.from(navDrawer.querySelectorAll(".nav-drawer-link")) : [];

  if (siteNav) {
    const onNavScroll = () => siteNav.classList.toggle("scrolled", window.scrollY > 60);
    window.addEventListener("scroll", onNavScroll, { passive: true });
    onNavScroll();
  }

  function openNavDrawer() {
    navHamburger?.classList.add("is-open");
    navHamburger?.setAttribute("aria-expanded", "true");
    navDrawer?.classList.add("is-open");
    navDrawer?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    navDrawerLinks.forEach((link) => link.setAttribute("tabindex", "0"));
  }

  function closeNavDrawer() {
    navHamburger?.classList.remove("is-open");
    navHamburger?.setAttribute("aria-expanded", "false");
    navDrawer?.classList.remove("is-open");
    navDrawer?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    navDrawerLinks.forEach((link) => link.setAttribute("tabindex", "-1"));
  }

  navHamburger?.addEventListener("click", () => {
    navDrawer?.classList.contains("is-open") ? closeNavDrawer() : openNavDrawer();
  });

  navDrawerLinks.forEach((link) => link.addEventListener("click", closeNavDrawer));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navDrawer?.classList.contains("is-open")) {
      closeNavDrawer();
      navHamburger?.focus();
    }
  });
});
