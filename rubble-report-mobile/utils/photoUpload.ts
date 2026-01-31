import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

const PHOTO_BUCKET = 'report-photos';

/**
 * Upload a photo to Supabase Storage
 * @param localUri - Local file URI (file:// path)
 * @param reportId - Report ID to associate the photo with
 * @returns Public URL of the uploaded photo, or null if failed
 */
export async function uploadPhotoToSupabase(
  localUri: string,
  reportId: string
): Promise<string | null> {
  try {
    console.log(`[PHOTO] Starting upload for report ${reportId} from URI:`, localUri);
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    console.log(`[PHOTO] File info:`, { exists: fileInfo.exists });
    
    if (!fileInfo.exists) {
      console.error('[PHOTO] File does not exist:', localUri);
      return null;
    }

    // Read file as base64
    console.log('[PHOTO] Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });
    console.log('[PHOTO] Base64 read, length:', base64.length);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${reportId}/${timestamp}.jpg`;
    console.log('[PHOTO] Generated filename:', fileName);

    // Convert base64 to ArrayBuffer for Supabase
    const arrayBuffer = decode(base64);
    console.log('[PHOTO] Converted to ArrayBuffer, size:', arrayBuffer.byteLength, 'bytes');

    // Upload to Supabase Storage
    console.log('[PHOTO] Uploading to Supabase storage bucket:', PHOTO_BUCKET);
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[PHOTO] Upload error:', error);
      console.error('[PHOTO] Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('[PHOTO] Upload successful, data:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(fileName);

    console.log('[PHOTO] ✓ Upload successful, public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[PHOTO] Upload failed with exception:', error);
    console.error('[PHOTO] Error message:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Upload multiple photos for a report
 * @param photoUris - Array of local file URIs
 * @param reportId - Report ID
 * @returns Array of public URLs (nulls for failed uploads)
 */
export async function uploadPhotosForReport(
  photoUris: string[],
  reportId: string
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const uri of photoUris) {
    const url = await uploadPhotoToSupabase(uri, reportId);
    if (url) {
      uploadedUrls.push(url);
    }
  }

  return uploadedUrls;
}

/**
 * Delete photos for a report from Supabase Storage
 * @param reportId - Report ID whose photos should be deleted
 */
export async function deleteReportPhotos(reportId: string): Promise<void> {
  try {
    // List all files in the report folder
    const { data: files, error: listError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .list(reportId);

    if (listError) {
      console.error('[PHOTO] Error listing files:', listError);
      return;
    }

    if (!files || files.length === 0) {
      return;
    }

    // Delete all files
    const filePaths = files.map(f => `${reportId}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error('[PHOTO] Error deleting files:', deleteError);
    } else {
      console.log(`[PHOTO] Deleted ${files.length} photos for report ${reportId}`);
    }
  } catch (error) {
    console.error('[PHOTO] Delete failed:', error);
  }
}

/**
 * Get photo URLs for a report
 * @param reportId - Report ID
 * @returns Array of photo URLs
 */
export async function getReportPhotos(reportId: string): Promise<string[]> {
  try {
    const { data: files, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .list(reportId);

    if (error || !files) {
      return [];
    }

    return files.map(f => {
      const { data } = supabase.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(`${reportId}/${f.name}`);
      return data.publicUrl;
    });
  } catch (error) {
    console.error('[PHOTO] Error getting photos:', error);
    return [];
  }
}
