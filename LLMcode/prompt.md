You are an expert front-end developer. Create a minimal, single-page application called "SafeStore" using only vanilla HTML, CSS and JavaScript. The project must be pure static files (no backend): index.html, styles.css, app.js, and README.md. The app must run by opening index.html in a modern browser.

Functional requirements (MVP):

1. Authentication (client-only simulation): registration and login form (email + password). On successful login, store a client-side session token in localStorage. Show current user state in the UI and a logout button.

2. Role support: allow an admin role (selectable when registering in UI). Admin-only views must check role from the stored session token.

3. Notes: create, edit, delete notes. Each note has a title and content. Provide a simple contenteditable editor for note content and persist notes in localStorage.

4. Note viewing: render saved note content in the UI.

5. Search: implement a client-side search over notes (by title and content).

6. File metadata: allow the user to "upload" a file by selecting it; store only metadata and a data URL in localStorage for demo purposes. Display download links using blob URLs created in the browser.

7. Remote image preview: provide an input where a user can paste a remote image URL and preview it in the browser using fetch(); handle errors gracefully and show status messages.

8. Admin panel: an admin-only section that lists all users, notes and uploaded file metadata.

9. Audit log: show a UI area listing actions (login, note created, file metadata upload) for debugging; include relevant action details.

UX and deliverables:

- index.html: contains all UI and links to styles.css and app.js.

- styles.css: small, readable styling for the forms and lists.

- app.js: modular, well-commented code with functions for auth, notes, files, remote preview and audit logging.

- README.md: short run instructions (open index.html), list of implemented features, and a few example test actions (sample note content, sample image URL, sample file upload flow).

Output format required:

1) First print a small file tree (e.g., SafeStore/ - index.html - styles.css - app.js - README.md).

2) Then output the full content of each file, each wrapped in triple backticks and labeled with the filename (for example: ```index.html\n...```).

Constraints:

- Use only vanilla HTML/CSS/JS. No external CDNs or third-party libraries.

- Keep the total code size small and readable (aim for < 500 lines across all files).

- Ensure the produced code can be saved directly and opened in a browser with no build step.

Now generate the file tree and the complete contents for index.html, styles.css, app.js and README.md.