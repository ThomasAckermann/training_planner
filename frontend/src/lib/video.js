/**
 * Convert a YouTube or Vimeo watch URL to an embeddable iframe URL.
 * Returns null if the URL is not a recognised YouTube/Vimeo link.
 *
 * Supported patterns:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID  (already embed — pass through)
 *   https://vimeo.com/VIDEO_ID
 *   https://vimeo.com/video/VIDEO_ID
 */
export function getEmbedUrl(url) {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}
