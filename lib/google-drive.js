import { google } from 'googleapis';

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/drive']
  );
}

/**
 * Upload a PDF buffer to Google Drive and return the file URL.
 * Files are uploaded to the root of the service account's Drive unless folderId is specified.
 *
 * @param {Buffer} pdfBuffer
 * @param {string} fileName
 * @param {string} [folderId]  — optional Drive folder ID
 * @returns {Promise<{ fileId: string, fileUrl: string }>}
 */
export async function uploadPdfToDrive(pdfBuffer, fileName, folderId) {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
  };
  if (folderId) metadata.parents = [folderId];

  const { data } = await drive.files.create({
    requestBody: metadata,
    media: {
      mimeType: 'application/pdf',
      body: bufferToStream(pdfBuffer),
    },
    fields: 'id, webViewLink',
  });

  // Make the file viewable by anyone with the link
  await drive.permissions.create({
    fileId: data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    fileId: data.id,
    fileUrl: data.webViewLink,
  };
}

function bufferToStream(buffer) {
  const { Readable } = require('stream');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
