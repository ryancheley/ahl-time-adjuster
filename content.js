// Fixed UTC offsets (hours) for timezone abbreviations. The abbreviation on the
// page states the offset directly, so we trust it rather than guessing DST from an
// IANA zone (Calgary stays on MDT year-round now, while America/Denver doesn't).
const TIMEZONE_OFFSETS = {
  'EST': -5, 'EDT': -4,
  'CST': -6, 'CDT': -5,
  'MST': -7, 'MDT': -6,
  'PST': -8, 'PDT': -7,
  'AST': -4, 'ADT': -3,
};

// Parse time string like "1:00 PM MDT" and convert to user's timezone
function convertGameTime(timeString, targetTimezone) {
  const match = timeString.match(/(\d{1,2}):(\d{2})\s(AM|PM)\s([A-Z]{3,4})/);
  if (!match) return null;

  const [, hours, minutes, period, sourceTimezoneAbbr] = match;
  const offset = TIMEZONE_OFFSETS[sourceTimezoneAbbr];
  if (offset === undefined) return null;

  // Convert 12-hour to 24-hour format
  let hour = parseInt(hours);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const today = new Date();
  const utcMs =
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hour, parseInt(minutes)) -
    offset * 3600000;

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(utcMs));
  } catch (e) {
    console.error('Error converting time:', e);
    return null;
  }
}

// Process a single text node
function processTextNode(node) {
  const text = node.textContent;
  const timeRegex = /\d{1,2}:\d{2}\s(AM|PM)\s[A-Z]{3,4}/g;

  if (timeRegex.test(text)) {
    chrome.storage.sync.get('timezone', (result) => {
      const timezone = result.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Reset regex for actual replacement
      const updatedText = text.replace(
        /\d{1,2}:\d{2}\s(AM|PM)\s[A-Z]{3,4}/g,
        (match) => {
          const converted = convertGameTime(match, timezone);
          return converted || match;
        }
      );

      if (updatedText !== text) {
        node.textContent = updatedText;
      }
    });
  }
}

// Walk through all text nodes and process them
function processPage() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    processTextNode(node);
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processPage);
} else {
  processPage();
}

// Also run on dynamic content changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      // Process new nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          processTextNode(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          let textNode;
          while ((textNode = walker.nextNode())) {
            processTextNode(textNode);
          }
        }
      });
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: false,
});
