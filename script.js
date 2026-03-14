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
