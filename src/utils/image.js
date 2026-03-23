export const PRODUCT_FALLBACK_IMAGE = `${import.meta.env.BASE_URL}images/flavors/pista_kulfi.png`
export const LOGO_FALLBACK_IMAGE = `${import.meta.env.BASE_URL}favicon.svg`

export const handleImageError = (event, fallbackSrc = PRODUCT_FALLBACK_IMAGE) => {
  const image = event.currentTarget
  if (image.src.endsWith(fallbackSrc)) return
  image.onerror = null
  image.src = fallbackSrc
}
