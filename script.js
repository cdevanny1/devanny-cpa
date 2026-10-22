const menuToggle = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector("#site-navigation");

if (menuToggle instanceof HTMLButtonElement && siteNavigation instanceof HTMLElement) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
    siteNavigation.classList.toggle("is-open", !isExpanded);
  });

  siteNavigation.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLAnchorElement)) return;

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    siteNavigation.classList.remove("is-open");
  });
}

const year = document.querySelector("#year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const taxChatForm = document.querySelector("#tax-chat-form");
const taxQuestion = document.querySelector("#tax-question");
const taxChatMessages = document.querySelector("#tax-chat-messages");
const taxChatStatus = document.querySelector("#tax-chat-status");

if (
  taxChatForm instanceof HTMLFormElement &&
  taxQuestion instanceof HTMLTextAreaElement &&
  taxChatMessages instanceof HTMLElement &&
  taxChatStatus instanceof HTMLElement
) {
  const sendButton = taxChatForm.querySelector("button[type='submit']");
  const suggestions = document.querySelectorAll(".tax-suggestion");

  const addMessage = (kind, text) => {
    const message = document.createElement("div");
    message.className = `tax-chat-message tax-chat-message-${kind}`;
    message.textContent = text;
    taxChatMessages.append(message);
    message.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  suggestions.forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
      if (!(suggestion instanceof HTMLButtonElement)) return;
      taxQuestion.value = suggestion.textContent.trim();
      taxQuestion.focus();
    });
  });

  taxChatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = taxQuestion.value.trim();

    if (question.length < 3) {
      taxChatStatus.textContent = "Please enter a little more detail.";
      taxQuestion.focus();
      return;
    }

    taxQuestion.disabled = true;
    if (sendButton instanceof HTMLButtonElement) sendButton.disabled = true;
    suggestions.forEach((suggestion) => {
      if (suggestion instanceof HTMLButtonElement) suggestion.disabled = true;
    });
    addMessage("user", question);
    taxQuestion.value = "";
    taxChatStatus.textContent = "Thinking through your question…";

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch("/.netlify/functions/tax-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The AI helper isn’t connected in this preview. Deploy the site on Netlify with its function and API settings to use it.",
        );
      }

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "The tax helper couldn’t answer just now. Please try again shortly.",
        );
      }

      if (typeof result.answer !== "string" || !result.answer.trim()) {
        throw new Error("The tax helper returned an empty answer. Please try again.");
      }

      addMessage("assistant", result.answer);
      taxChatStatus.textContent = "For general information only. Please verify details for your situation.";
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "That took too long. Please try again."
          : error instanceof TypeError
            ? "The AI helper is available after this site is deployed with its Netlify function and API settings."
            : error instanceof Error
              ? error.message
              : "The tax helper couldn’t answer just now. Please try again shortly.";
      addMessage("assistant", message);
      taxChatStatus.textContent = "Your question wasn’t saved. Please try again later or contact the firm.";
    } finally {
      window.clearTimeout(timeout);
      taxQuestion.disabled = false;
      if (sendButton instanceof HTMLButtonElement) sendButton.disabled = false;
      suggestions.forEach((suggestion) => {
        if (suggestion instanceof HTMLButtonElement) suggestion.disabled = false;
      });
      taxQuestion.focus();
    }
  });
}
