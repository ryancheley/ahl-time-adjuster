// List of common North American timezones
const TIMEZONES = [
  { label: 'Eastern (US & Canada)', value: 'America/New_York' },
  { label: 'Central (US & Canada)', value: 'America/Chicago' },
  { label: 'Mountain (US & Canada)', value: 'America/Denver' },
  { label: 'Pacific (US & Canada)', value: 'America/Los_Angeles' },
  { label: 'Alaska', value: 'America/Anchorage' },
  { label: 'Hawaii-Aleutian', value: 'Pacific/Honolulu' },
  { label: 'Atlantic (Canada)', value: 'America/Halifax' },
  { label: 'Newfoundland (Canada)', value: 'America/St_Johns' },
  { label: 'Mountain (Arizona)', value: 'America/Phoenix' },
  { label: 'Central (Mexico)', value: 'America/Mexico_City' },
];

const tzSelect = document.getElementById('timezone');
const saveBtn = document.getElementById('save');
const statusDiv = document.getElementById('status');

// Populate timezone select
function populateTimezones() {
  tzSelect.innerHTML = '';
  TIMEZONES.forEach((tz) => {
    const option = document.createElement('option');
    option.value = tz.value;
    option.textContent = tz.label;
    tzSelect.appendChild(option);
  });
}

// Load saved timezone
function loadTimezone() {
  chrome.storage.sync.get('timezone', (result) => {
    if (result.timezone) {
      tzSelect.value = result.timezone;
    } else {
      // Default to system timezone if available
      try {
        const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (TIMEZONES.some((tz) => tz.value === systemTz)) {
          tzSelect.value = systemTz;
        }
      } catch (e) {
        // Fallback
      }
    }
  });
}

// Save timezone
saveBtn.addEventListener('click', () => {
  const selectedTz = tzSelect.value;
  if (selectedTz) {
    chrome.storage.sync.set({ timezone: selectedTz }, () => {
      statusDiv.textContent = '✓ Timezone saved!';
      statusDiv.classList.add('success');
      setTimeout(() => {
        statusDiv.classList.remove('success');
      }, 2000);
    });
  }
});

populateTimezones();
loadTimezone();
