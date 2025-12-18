# Legacy Files (v3.0)

These files are preserved for backward compatibility but are superseded by enhanced versions:

## Legacy Files

- `content.js` → Use `content-enhanced.js`
- `popup.js` → Use `popup-enhanced.js`
- `popup.html` → Use `popup-enhanced.html`

## Migration Status

- **v4.0+**: Uses enhanced versions
- **v3.0**: Used basic versions
- **manifest.json**: Points to enhanced versions

## Recommendation

These files can be safely removed if you're only supporting v4.0+.

To remove legacy files:

```bash
rm content.js popup.js popup.html
rm build/content.js build/popup.js build/popup.html
```

## Kept for Reference

If maintaining backward compatibility with v3.0 users, keep these files.
Otherwise, they are redundant.
