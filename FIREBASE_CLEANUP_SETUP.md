
# Firebase Storage Cleanup Setup

## Automatic File Deletion After 7 Days

To automatically delete PDFs after 7 days, you need to set up Firebase Cloud Functions. Here's how:

### Option 1: Firebase Storage Lifecycle Rules (Recommended)

1. Go to Firebase Console → Storage
2. Click on the "Rules" tab
3. Add this lifecycle rule:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 7,
          "matchesPrefix": ["pdfs/"]
        }
      }
    ]
  }
}
```

### Option 2: Cloud Functions (More Control)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run: `firebase init functions`
3. Create this function in `functions/index.js`:

```javascript
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");

initializeApp();

exports.cleanupExpiredPDFs = onSchedule("0 2 * * *", async (event) => {
  const db = getFirestore();
  const storage = getStorage();
  const now = new Date();

  try {
    const expiredFiles = await db.collection('pdfFiles')
      .where('expirationDate', '<=', now)
      .get();

    const deletePromises = [];

    expiredFiles.forEach(doc => {
      const data = doc.data();
      
      // Delete from Storage
      deletePromises.push(
        storage.bucket().file(data.filePath).delete()
      );
      
      // Delete metadata from Firestore
      deletePromises.push(
        doc.ref.delete()
      );
    });

    await Promise.all(deletePromises);
    console.log(`Cleaned up ${expiredFiles.size} expired PDF files`);
  } catch (error) {
    console.error('Error cleaning up expired files:', error);
  }
});
```

4. Deploy: `firebase deploy --only functions`

### Current Implementation

The current code stores file metadata in Firestore with expiration dates. The cleanup function logs a note that it should be implemented as a Cloud Function for production use.

Files are uploaded to: `pdfs/{userId}/{filename}`
Metadata stored in: `pdfFiles/{userId}_{filename}`

### Benefits

- ✅ Automatic cleanup after 7 days
- ✅ Secure download URLs
- ✅ Cross-device access
- ✅ No manual file management
- ✅ Storage space optimization
