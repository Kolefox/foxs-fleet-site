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

  // BOOKING WEBHOOK URL: Update this if the GoHighLevel inbound webhook ever changes.
  const bookingWebhookUrl =
    "https://services.leadconnectorhq.com/hooks/VS0PZHPpr79qaZ00fQJo/webhook-trigger/2070309d-b0c7-48f5-8f8c-0550a333ab4a";

  function getLocalDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    });
  }

  function closeAllModals() {
    modalBackdrops.forEach((modal) => modal.classList.remove("open"));
    document.body.style.overflow = "";
  }

  function openModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (!modal) {
      return;
    }

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
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
      let dragDeltaX = 0;
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

      function finishDrag(pointerId) {
        if (!isDragging) {
          return;
        }

        if (typeof pointerId === "number" && viewport.hasPointerCapture?.(pointerId)) {
          viewport.releasePointerCapture(pointerId);
        }

        viewport.classList.remove("is-dragging");
        isDragging = false;

        const swipeThreshold = Math.max(settings.swipeThreshold, slideWidth * 0.12);

        if (Math.abs(dragDeltaX) > swipeThreshold) {
          stepCarousel(dragDeltaX < 0 ? 1 : -1, { restartAutoplay: true });
        } else {
          goToIndex(currentIndex, { animated: true, restartAutoplay: true });
        }

        dragDeltaX = 0;
        activePointerId = null;
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

      viewport.addEventListener("pointerdown", (event) => {
        if ((event.pointerType === "mouse" && event.button !== 0) || isTransitioning) {
          return;
        }

        if (event.pointerType === "mouse") {
          event.preventDefault();
        }

        activePointerId = event.pointerId;
        dragStartX = event.clientX;
        dragDeltaX = 0;
        isDragging = true;
        viewport.classList.add("is-dragging");
        clearAutoplay();
        setTrackTransition(false);
        viewport.setPointerCapture?.(event.pointerId);
      });

      viewport.addEventListener("pointermove", (event) => {
        if (!isDragging || event.pointerId !== activePointerId) {
          return;
        }

        dragDeltaX = event.clientX - dragStartX;
        track.style.transform = `translate3d(${-getOffsetForIndex(currentIndex) + dragDeltaX}px, 0, 0)`;
      });

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

        finishDrag(event.pointerId);
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
      if (modal) {
        modal.classList.remove("open");
      }
      document.body.style.overflow = "";
    });
  });

  modalBackdrops.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      modal.classList.remove("open");
      document.body.style.overflow = "";
    });
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
    };

    pickupInput.addEventListener("change", handleBookingDateChange);
    pickupInput.addEventListener("input", handleBookingDateChange);
    dropoffInput.addEventListener("change", handleBookingDateChange);
    dropoffInput.addEventListener("input", handleBookingDateChange);
  }
});
