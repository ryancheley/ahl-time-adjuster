# AHL Time Adjuster

A Chrome extension that converts AHL game times displayed on theahl.com to your local timezone.

## Features

- Automatically finds all game times on theahl.com
- Converts times from the game's local timezone to your selected timezone
- Settings page to configure your preferred timezone
- Works with dynamically loaded content

## Installation

1. Save these files in a directory:
   - `manifest.json`
   - `content.js`
   - `popup.html`
   - `popup.js`

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top right)

4. Click **Load unpacked** and select the directory containing the extension files

5. The extension should now appear in your Chrome extensions list

## Usage

1. Click the AHL Time Adjuster extension icon (puzzle piece, top right)

2. Select your timezone from the dropdown

3. Click **Save**

4. Visit https://theahl.com/ - game times will now display in your local timezone

## How It Works

The extension recognizes game times in the format shown on theahl.com (e.g., "1:00 PM MDT") and converts them to your selected timezone. Both the time and timezone abbreviation are updated.

## Supported Timezones

- Eastern (US & Canada)
- Central (US & Canada)
- Mountain (US & Canada)
- Pacific (US & Canada)
- Alaska
- Hawaii-Aleutian
- Atlantic (Canada)
- Newfoundland (Canada)
- Mountain (Arizona - no DST)
- Central (Mexico)

Additional timezones can be added by editing the `TIMEZONES` array in `popup.js`.
