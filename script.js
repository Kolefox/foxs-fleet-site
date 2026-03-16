document.addEventListener("DOMContentLoaded", () => {
  const fadeInElements = document.querySelectorAll(".fade-in");
  const modalBackdrops = document.querySelectorAll(".modal-backdrop");
  const scrollButtons = document.querySelectorAll("[data-scroll-target]");
  const modalOpenButtons = document.querySelectorAll("[data-modal-open]");
  const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
  const bookingForm = document.getElementById("booking-form");
  const vehicleSelect = document.getElementById("vehicle");
  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");

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

  // BOOKING FORM: Update submit messaging, validation rules, or connect this form to a backend here.
  if (bookingForm) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const submitButton = bookingForm.querySelector('button[type="submit"]');
      if (!submitButton) {
        return;
      }

      const defaultLabel = submitButton.textContent;
      submitButton.textContent = "\u2713 Request Sent!";
      submitButton.style.background = "#2d7a3a";
      submitButton.disabled = true;

      window.setTimeout(() => {
        submitButton.textContent = defaultLabel;
        submitButton.style.background = "";
        submitButton.disabled = false;
        bookingForm.reset();

        if (pickupInput) {
          dropoffInput.min = pickupInput.min;
        }
      }, 4000);
    });
  }

  if (pickupInput && dropoffInput) {
    const today = new Date().toISOString().split("T")[0];
    pickupInput.min = today;
    dropoffInput.min = today;

    pickupInput.addEventListener("change", () => {
      dropoffInput.min = pickupInput.value || today;

      if (dropoffInput.value && dropoffInput.value < dropoffInput.min) {
        dropoffInput.value = dropoffInput.min;
      }
    });
  }
});
