# SafeStore - Secure Note Storage

A minimal, single-page application for secure note storage and file management using vanilla HTML, CSS, and JavaScript.

## Features

- 🔐 **Authentication**: Client-side user registration and login
- 👥 **Role Support**: Admin and user roles with different permissions
- 📝 **Notes**: Create, edit, delete notes with rich content editing
- 🔍 **Search**: Client-side search across note titles and content
- 📁 **File Upload**: Upload files with metadata storage (data URLs)
- 🌐 **Remote Image Preview**: Preview remote images with error handling
- 👮 **Admin Panel**: Admin-only view of all users, notes, and files
- 📊 **Audit Log**: Action tracking for debugging and monitoring

## Quick Start

1. **Open the application**: Simply open `index.html` in a modern web browser
2. **Register**: Create a new account (check "Admin Role" for admin privileges)
3. **Login**: Use your credentials to access the application
4. **Start using**: Create notes, upload files, and explore features

## Test Data Examples

### Sample Note Content
- **Title**: "Project Ideas"
- **Content**: "## Brainstorming\n- Mobile app for task management\n- Web-based drawing tool\n- AI-powered recipe generator\n\n**Next Steps**: Research market demand"

### Sample Image URL for Preview
```
https://picsum.photos/400/300
https://via.placeholder.com/400x300
```

### Sample File Upload Flow
1. Click "Files" tab
2. Click "Choose File" and select any document or image
3. Click "Upload File"
4. File metadata will be stored and download link created

## User Roles

### Regular User
- Create, edit, delete own notes
- Upload and manage own files
- Preview remote images
- View audit log

### Admin User
- All regular user privileges
- View all users in the system
- Access all notes (read-only)
- See all uploaded files
- Full audit log access

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Storage Details

All data is stored locally in the browser using:
- `localStorage` for persistent data
- Data URLs for file content
- Session tokens with 24-hour expiration

## Security Notes

- This is a client-only demonstration application
- Passwords are stored in plain text (for demo purposes only)
- No actual encryption is implemented
- Do not use for sensitive real-world data

## File Structure

```
SafeStore/
├── index.html      # Main application interface
├── styles.css      # Minimal styling and layout
├── app.js          # Application logic and functionality
└── README.md       # This documentation file
```

## Development

The application uses pure vanilla JavaScript with no external dependencies:
- Modern ES6+ features
- Async/await for remote image fetching
- Local storage API for persistence
- Contenteditable for note editing

## Limitations

- Client-side only - no server persistence
- Limited to browser storage capacity (~5MB)
- No real encryption or security
- Single-user device only (no sharing)

## Troubleshooting

If the application doesn't work:
1. Ensure you're using a modern browser
2. Check that JavaScript is enabled
3. Clear browser cache and reload
4. Verify localStorage is available

## License

This is a demonstration project for educational purposes.