/**
 * Telegram-style client-side photo compression: phone camera shots easily
 * exceed 10 MB, while the API caps uploads at 5 MB. Before uploading, images
 * are downscaled to a sane dimension and re-encoded as JPEG — a 12 MB photo
 * becomes a few hundred KB with no visible quality loss on a phone screen.
 */

/** Longest side after downscaling — plenty for chat and profile imagery. */
const MAX_DIMENSION = 2048

/** JPEG quality: 0.82 is the sweet spot between size and visible artifacts. */
const JPEG_QUALITY = 0.82

/** Images at or below this size are sent untouched — nothing to win. */
const SKIP_BELOW_BYTES = 500 * 1024

/**
 * Compress an image file if it is worth it. Non-images, GIFs (animation would
 * be lost) and already-small files pass through unchanged. Falls back to the
 * original on any decode/encode failure — the server-side limit still guards.
 */
export async function compressImage(file: File): Promise<File> {
  const type = file.type.toLowerCase()

  if (!type.startsWith('image/') || type === 'image/gif' || file.size <= SKIP_BELOW_BYTES) {
    return file
  }

  try {
    const bitmap = await decode(file)

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return file

    // JPEG has no alpha — fill white so transparent PNGs don't turn black.
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)

    if ('close' in bitmap) bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    })

    // Keep the original when compression didn't actually help.
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
  }
  catch {
    return file
  }
}

type Decoded = ImageBitmap | HTMLImageElement

/** Decode via createImageBitmap, falling back to <img> for older WebViews. */
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    }
    catch {
      // fall through to the <img> path
    }
  }

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = (event) => {
      URL.revokeObjectURL(url)
      reject(event instanceof Event ? new Error('Image decode failed') : event)
    }
    image.src = url
  })
}
