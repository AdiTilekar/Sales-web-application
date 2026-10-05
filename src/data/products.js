const FLAVOR_BASE_URL = 'https://aditilekar.github.io/ShreeGaneshKulfi.github.io/images/flavors/'
const LOCAL_FLAVOR_BASE = `${import.meta.env.BASE_URL}images/flavors/`

export const DEFAULT_SHOP_ID = 'shop-1'

export const SHOPS = [
  { id: 'shop-1', name: 'Chikhali Branch', priceAdjustment: 0 },
  { id: 'shop-2', name: 'Akurdi Branch', priceAdjustment: 5 },
]

const SHOP_BY_ID = SHOPS.reduce((acc, shop) => ({ ...acc, [shop.id]: shop }), {})

export const PRODUCTS = [
  { id: 'mango', name: 'Mango', price: 30, profitPerUnit: 10, costPrice: 20, image: `${LOCAL_FLAVOR_BASE}mango_kulfi.webp` },
  { id: 'rabdi', name: 'Rabdi', price: 30, profitPerUnit: 13, costPrice: 17, image: `${LOCAL_FLAVOR_BASE}rabdi_kulfi.webp` },
  { id: 'small-rabdi', name: 'Small Rabdi Kulfi', price: 15, profitPerUnit: 6, costPrice: 9, image: `${LOCAL_FLAVOR_BASE}small_rabdi_kulfi.webp` },
  { id: 'dry-fruit', name: 'Dry Fruit', price: 35, profitPerUnit: 10, costPrice: 25, image: `${LOCAL_FLAVOR_BASE}dry_fruit_kulfi.webp` },
  { id: 'pista', name: 'Pista', price: 35, profitPerUnit: 13, costPrice: 22, image: `${LOCAL_FLAVOR_BASE}pista_kulfi.webp` },
  { id: 'chocolate', name: 'Chocolate', price: 30, profitPerUnit: 8, costPrice: 22, image: `${LOCAL_FLAVOR_BASE}chocolate_kulfi.webp` },
  { id: 'paan', name: 'Paan', price: 30, profitPerUnit: 9, costPrice: 21, image: `${LOCAL_FLAVOR_BASE}paan_kulfi.webp` },
  { id: 'strawberry', name: 'Strawberry', price: 30, profitPerUnit: 10, costPrice: 20, image: `${LOCAL_FLAVOR_BASE}strawberry_kulfi.webp` },
  { id: 'sitafal', name: 'Sitafal', price: 30, profitPerUnit: 8, costPrice: 22, image: `${LOCAL_FLAVOR_BASE}sitafal_kulfi.webp` },
  { id: 'gulkand', name: 'Gulkand', price: 30, profitPerUnit: 13, costPrice: 17, image: `${LOCAL_FLAVOR_BASE}gulkand_kulfi.webp` },
  { id: 'pineapple', name: 'Pineapple', price: 30, profitPerUnit: 10, costPrice: 20, image: `${LOCAL_FLAVOR_BASE}pineapple_kulfi.webp` },
  { id: 'red-peru', name: 'Red Peru', price: 30, profitPerUnit: 10, costPrice: 20, image: `${LOCAL_FLAVOR_BASE}guava_kulfi.webp` },
  { id: 'jamun', name: 'Jamun', price: 30, profitPerUnit: 10, costPrice: 20, image: `${LOCAL_FLAVOR_BASE}jamun_kulfi.webp` },
  { id: 'chikoo', name: 'Chikoo', price: 30, profitPerUnit: 10, costPrice: 20, image: `${LOCAL_FLAVOR_BASE}chikoo_kulfi.webp` },
  { id: 'anjeer', name: 'Anjeer', price: 35, profitPerUnit: 10, costPrice: 25, image: `${LOCAL_FLAVOR_BASE}fig_kulfi.webp` },
  { id: 'mava', name: 'Mava Kulfi', price: 30, profitPerUnit: 10, costPrice: 20, image: `${LOCAL_FLAVOR_BASE}mava_kulfi.webp` },
  { id: 'butterscotch', name: 'Butterscotch', price: 30, profitPerUnit: 10, costPrice: 20, image: `${LOCAL_FLAVOR_BASE}butterscotch_kulfi.webp` },
]

export const getProductsForShop = (shopId = DEFAULT_SHOP_ID) => {
  const shop = SHOP_BY_ID[shopId] || SHOP_BY_ID[DEFAULT_SHOP_ID]
  return PRODUCTS.map((product) => ({
    ...product,
    price: product.id === 'small-rabdi' ? product.price : product.price + (shop?.priceAdjustment || 0),
  }))
}

export const LOGO_URL = 'https://aditilekar.github.io/ShreeGaneshKulfi.github.io/images/logo.png'
