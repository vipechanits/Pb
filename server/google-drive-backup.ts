import { google } from 'googleapis';

let connectionSettings: any = null;

export async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function listBackupFiles() {
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.list({
      q: "name contains 'payback247-backup' and trashed=false",
      spaces: 'drive',
      fields: 'files(id, name, mimeType, createdTime, size, webViewLink)',
      orderBy: 'createdTime desc',
      pageSize: 50,
    });

    return response.data.files || [];
  } catch (error) {
    console.error('[GOOGLE DRIVE] Failed to list backup files:', error);
    throw error;
  }
}

export async function downloadBackupFromDrive(fileId: string) {
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return response.data;
  } catch (error) {
    console.error(`[GOOGLE DRIVE] Failed to download backup ${fileId}:`, error);
    throw error;
  }
}

export async function uploadBackupToDrive(fileName: string, fileContent: string) {
  try {
    const drive = await getGoogleDriveClient();

    const fileMetadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    const media = {
      mimeType: 'application/json',
      body: fileContent,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, createdTime, size',
    });

    return response.data;
  } catch (error) {
    console.error('[GOOGLE DRIVE] Failed to upload backup:', error);
    throw error;
  }
}

export async function deleteBackupFromDrive(fileId: string) {
  try {
    const drive = await getGoogleDriveClient();
    await drive.files.delete({ fileId });
    console.log(`[GOOGLE DRIVE] Successfully deleted backup ${fileId}`);
  } catch (error) {
    console.error(`[GOOGLE DRIVE] Failed to delete backup ${fileId}:`, error);
    throw error;
  }
}
