# SafeStore (MVP)

A minimal single-page app built with vanilla HTML/CSS/JS. Pure static files — open `index.html` in a modern browser. All data persists in your browser using `localStorage`.

## Run

- Option 1: Double-click `index.html` to open it.
- Option 2: Serve the folder locally (e.g., `python3 -m http.server`) and visit `http://localhost:8000/index.html`.

## Features Implemented

- Authentication (client-only): register + login with email/password.
- Session token stored in `localStorage`; logout supported.
- Roles: pick `admin` during registration to access admin-only panel.
- Notes: create, edit, delete; contenteditable editor; persisted.
- Note viewing: click note in the list to load into editor.
- Search: client-side search by title and content.
- File metadata: select a file; store metadata and a data URL; provide a browser blob download link.
- Remote image preview: paste a remote image URL, fetch via `fetch()`, and preview; error messages shown.
- Admin panel: lists all users, all notes, all files (metadata) across the demo DB.
- Audit log: shows actions like register, login, note changes, file saves, image previews.

## Example Test Actions

1. Register and login
   - Email: `admin@example.com` | Password: `test123` | Role: `Admin`.
   - Then register a normal user: `user@example.com` | `test123`.

2. Notes
   - Create a note titled `Welcome`.
   - Content: `This is SafeStore. Try bold and lists!`.
   - Save; create another note; test search with `safe`.

3. File upload (metadata)
   - Choose any small image or text file.
   - Confirm metadata appears with size/type and a `Download` link.

4. Remote image preview
   - Sample URL: `https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg`
   - Click `Preview`; success shows image; failures display error.

5. Admin panel
   - Login as the admin user to see Users/Notes/Files across the demo DB.

## Notes

- This is a demo; passwords and data live only in your browser.
- For images, some servers may block cross-origin requests; errors are reported in the UI.
- No external libraries or build steps — just static files.