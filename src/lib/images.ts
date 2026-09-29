import {supabase} from './supabase';
import type {SaveResult} from './content';

export type {SaveResult};

export type ImageSlot = 'hero' | 'about' | 'journey';

export interface SiteImage {
  id: string;
  slot: ImageSlot;
  url: string;
  storage_path: string;
  alt: string;
  heading: string;
  description: string;
  updated_at: string;
}

export const IMAGE_SLOTS: Array<{id: ImageSlot; label: string; hint: string}> = [
  {id: 'hero', label: 'Hero Section', hint: 'The main image shown behind your name on the home page.'},
  {id: 'about', label: 'About Me', hint: 'Your portrait in the "My Story" section.'},
  {id: 'journey', label: 'My Journey', hint: 'The image used alongside your journey / qualifications.'},
];

export const BUCKET = 'site-images';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const COLUMNS = 'id,slot,url,storage_path,alt,heading,description,updated_at';

function toSlot(value: unknown): ImageSlot {
  return value === 'about' || value === 'journey' ? value : 'hero';
}

export async function loadSiteImages(): Promise<SiteImage[]> {
  if (!supabase) return [];
  const {data, error} = await supabase.from('site_images').select(COLUMNS).order('slot');
  if (error || !data) return [];
  return (data as SiteImage[]).map((row) => ({...row, slot: toSlot(row.slot)}));
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, WebP, GIF or AVIF images are allowed.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Image must be under ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`;
  }
  return null;
}

export function publicUrl(path: string): string {
  if (!supabase || path === '') return '';
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Uploads to Storage and points the slot's row at the new file. */
export async function uploadSiteImage(slot: ImageSlot, file: File): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const invalid = validateImageFile(file);
  if (invalid) return {ok: false, error: invalid};

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${slot}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const {error: uploadError} = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {cacheControl: '3600', upsert: false, contentType: file.type});
  if (uploadError) return {ok: false, error: uploadError.message};

  const saved = await saveSiteImage({slot, storage_path: path, url: publicUrl(path)});
  if (!saved.ok) {
    // Roll the orphaned file back so the bucket does not fill with dead uploads.
    await supabase.storage.from(BUCKET).remove([path]);
    return saved;
  }
  return {ok: true};
}

/** Removes the stored file and falls the slot back to its default image. */
export async function deleteSiteImage(slot: ImageSlot, storagePath: string): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};

  if (storagePath) {
    const {error} = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) return {ok: false, error: error.message};
  }
  return saveSiteImage({slot, storage_path: '', url: ''});
}

export async function saveSiteImage(
  patch: Partial<SiteImage> & {slot: ImageSlot},
): Promise<SaveResult> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured'};
  const {error} = await supabase
    .from('site_images')
    .upsert({...patch, updated_at: new Date().toISOString()}, {onConflict: 'slot'});
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}

/** Resets a slot to the checked-in static asset that ships with the site. */
export const SLOT_DEFAULTS: Record<ImageSlot, string> = {
  hero: '/sakshi_portrait.jpg',
  about: '/Character_head_tracking_animation_20260923172045.jpeg',
  journey: '/sakshi_portrait.jpg',
};
