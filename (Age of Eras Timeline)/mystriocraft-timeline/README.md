# MystrioCraft Studio — Timeline Website

A responsive personal timeline builder made with plain HTML, CSS, and JavaScript. No frameworks or installation are needed.

## Run it in VS Code

1. Extract the `mystriocraft-timeline` folder.
2. Open that folder in Visual Studio Code.
3. Open `index.html` in a browser, or use the **Live Server** VS Code extension and choose **Open with Live Server**.
4. Select **Add timeline event** to create numbered points. Click a point or its card to read the description.

## Features

- Welcome banner that fades away automatically, with a close button.
- Editable site title, introduction, welcome message, timeline start/end values, and endpoint labels.
- Add, edit, and delete event points.
- Events are positioned proportionally between the start and end values; the larger age appears farther left.
- Numbered markers and a searchable event list underneath the timeline.
- Click a marker or list card to open its full description.
- Automatic saving in the current browser using `localStorage`.
- Export and import JSON backups to move or protect your timeline data.
- Responsive layout for desktop and mobile screens.

## Timeline age values

The default range follows the example in the sketch: **18,000,000,000** years ago on the left and **5,007** years ago on the right. These are editable example settings, not a statement that the Earth is 18 billion years old. Enter each event's age in years ago, within the configured range.

## Files

- `index.html` — page structure
- `style.css` — visual design and responsive layout
- `script.js` — event management, timeline placement, validation, and browser storage

## Storage note

This version has no server or database. Data is stored locally in the browser profile where the page is opened. Export a JSON backup before clearing browser data or changing devices. If you later want public visitors to share one common timeline, the project will need a backend or database.
