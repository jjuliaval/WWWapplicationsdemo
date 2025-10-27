# SafeStore - Secure Note Management Application

A minimal, single-page application for secure note management with file handling and admin features, built with vanilla HTML, CSS, and JavaScript.

## Quick Start

1. Open `index.html` in any modern web browser
2. No build step or server required - runs entirely client-side
3. All data is stored in browser localStorage

## Features Implemented

### ✅ Authentication (Client-side Simulation)
- User registration with email and password
- Admin role selection during registration
- Login/logout functionality
- Session management with localStorage
- Current user display in UI

### ✅ Role-based Access Control
- Admin role support
- Admin-only sections with role verification
- Different UI views based on user role

### ✅ Notes Management
- Create, edit, and delete notes
- Rich text editor with contenteditable
- Notes persistence in localStorage
- User-specific note access

### ✅ Search Functionality
- Real-time search across note titles and content
- Client-side filtering
- Instant results as you type

### ✅ File Metadata Handling
- File selection and metadata storage
- Data URL generation for demo purposes
- Download functionality using blob URLs
- File size formatting and upload timestamps

### ✅ Remote Image Preview
- URL input for remote images
- Fetch-based image loading with CORS handling
- Error handling with status messages
- Graceful failure for invalid URLs or non-images

### ✅ Admin Panel
- User management view
- All notes overview
- All files metadata view
- Admin-only access control

### ✅ Audit Logging
- Action tracking (login, note creation, file uploads)
- Timestamp and user information
- Detailed action logs with context
- Persistent audit trail

## Example Test Actions

### 1. User Registration and Login
```
1. Click "Register" tab
2. Enter email: admin@test.com
3. Enter password: admin123
4. Check "Admin Role" checkbox
5. Click "Register"
6. Switch to "Login" tab
7. Login with the same credentials
```

### 2. Create and Search Notes
```
1. After login, click "New Note"
2. Title: "Meeting Notes"
3. Content: "Discussed project timeline and deliverables for Q1 2024"
4. Click "Save"
5. Create another note with title "Shopping List"
6. Use search bar to search for "project" - should find the meeting note
```

### 3. File Upload Demo
```
1. Go to "Files" tab
2. Click "Choose Files" and select any file from your computer
3. File metadata will be stored and displayed
4. Click "Download" to test blob URL generation
```

### 4. Remote Image Preview
```
1. Go to "Images" tab
2. Paste this sample URL: https://picsum.photos/400/300
3. Click "Preview"
4. Image should load and display
5. Try an invalid URL to see error handling
```

### 5. Admin Panel Access
```
1. Login as admin user
2. Click "Admin" tab (only visible to admins)
3. Browse through "Users", "All Notes", and "All Files" tabs
4. View system-wide data
```

### 6. Audit Log Review
```
1. Click "Audit Log" tab
2. Review all logged actions with timestamps
3. See user activities and system events
```

## Technical Details

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage
- **No Dependencies**: No external libraries or CDNs
- **Responsive**: Mobile-friendly design
- **Security**: Client-side role checking (demo purposes)

## File Structure

```
SafeStore/
├── index.html      # Main application UI
├── styles.css      # Styling and responsive design
├── app.js          # Application logic and functionality
└── README.md       # This documentation
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Limitations

- This is a demo application with client-side only security
- Data is stored in localStorage (not suitable for production)
- File uploads store data URLs (memory intensive for large files)
- No real authentication or encryption
- CORS limitations may affect remote image preview for some URLs

## Development Notes

The application uses a modular class-based approach with:
- Separation of concerns between UI and data management
- Event-driven architecture
- Defensive programming with error handling
- Clean, readable code structure under 500 lines total