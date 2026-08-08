// Timezone abbreviation to IANA timezone mapping for AHL teams
const TIMEZONE_MAP = {
  'EST': 'America/New_York',
  'EDT': 'America/New_York',
  'CST': 'America/Chicago',
  'CDT': 'America/Chicago',
  'MST': 'America/Denver',
  'MDT': 'America/Denver',
  'PST': 'America/Los_Angeles',
  'PDT': 'America/Los_Angeles',
  'AST': 'America/Halifax',
  'ADT': 'America/Halifax',
};

// Parse time string like "1:00 PM MDT" and convert to user's timezone
function convertGameTime(timeString, targetTimezone) {
  // Match pattern like "1:00 PM MDT"
  const match = timeString.match(/(\d{1,2}):(\d{2})\s(AM|PM)\s([A-Z]{3,4})/);
  if (!match) return null;

  const [, hours, minutes, period, sourceTimezoneAbbr] = match;
  const sourceTimezone = TIMEZONE_MAP[sourceTimezoneAbbr];

  if (!sourceTimezone) return null;

  // Create a date string for today
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Convert 12-hour to 24-hour format
  let hour = parseInt(hours);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  // Create a date in the source timezone
  const timeInSourceTz = `${dateStr}T${String(hour).padStart(2, '0')}:${minutes}:00`;

  // Format for conversion using Intl API
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: sourceTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // We need to create a date that represents the local time in the source timezone
  // This is tricky because we're given a time in a different timezone
  // We'll use a workaround by adjusting for the timezone offset

  try {
    // Create initial date (assumes system timezone)
    const date = new Date(timeInSourceTz);

    // Get the offset between source timezone and UTC
    const sourceFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: sourceTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = sourceFormatter.formatToParts(date);
    const sourceYear = parts.find(p => p.type === 'year').value;
    const sourceMonth = parts.find(p => p.type === 'month').value;
    const sourceDay = parts.find(p => p.type === 'day').value;
    const sourceHour = parts.find(p => p.type === 'hour').value;
    const sourceMinute = parts.find(p => p.type === 'minute').value;

    // Calculate offset
    const offsetMs =
      date.getTime() -
      new Date(
        `${sourceYear}-${sourceMonth}-${sourceDay}T${sourceHour}:${sourceMinute}:00`
      ).getTime();

    // Create correct date
    const correctDate = new Date(
      new Date(timeInSourceTz).getTime() + offsetMs
    );

    // Format in target timezone
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return targetFormatter.format(correctDate);
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
