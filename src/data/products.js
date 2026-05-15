const FLAVOR_BASE_URL = 'https://aditilekar.github.io/ShreeGaneshKulfi.github.io/images/flavors/'
const LOCAL_FLAVOR_BASE = `${import.meta.env.BASE_URL}images/flavors/`

export const DEFAULT_SHOP_ID = 'shop-1'

export const SHOPS = [
  { id: 'shop-1', name: 'Chikhali Branch', priceAdjustment: 0 },
  { id: 'shop-2', name: 'Akurdi Branch', priceAdjustment: 5 },
]

const SHOP_BY_ID = SHOPS.reduce((acc, shop) => ({ ...acc, [shop.id]: shop }), {})

export const PRODUCTS = [
  { id: 'mango', name: 'Mango', price: 25, profitPerUnit: 9, image: `${FLAVOR_BASE_URL}mango_kulfi.png` },
  { id: 'rabdi', name: 'Rabdi', price: 25, profitPerUnit: 9, image: `${FLAVOR_BASE_URL}rabdi_kulfi.png` },
  { id: 'small-rabdi', name: 'Small Rabdi Kulfi', price: 15, profitPerUnit: 7, image: `${FLAVOR_BASE_URL}rabdi_kulfi.png` },
  { id: 'dry-fruit', name: 'Dry Fruit', price: 30, profitPerUnit: 6, image: `${FLAVOR_BASE_URL}dry_fruit_kulfi.png` },
  { id: 'pista', name: 'Pista', price: 30, profitPerUnit: 9, image: `${LOCAL_FLAVOR_BASE}pista_kulfi.png` },
  { id: 'chocolate', name: 'Chocolate', price: 25, profitPerUnit: 4, image: `${FLAVOR_BASE_URL}chocolate_kulfi.png` },
  { id: 'paan', name: 'Paan', price: 25, profitPerUnit: 5, image: `${FLAVOR_BASE_URL}paan_kulfi.png` },
  { id: 'strawberry', name: 'Strawberry', price: 25, profitPerUnit: 6, image: `${FLAVOR_BASE_URL}strawberry_kulfi.png` },
  { id: 'sitafal', name: 'Sitafal', price: 25, profitPerUnit: 4, image: `${FLAVOR_BASE_URL}sitafal_kulfi.png` },
  { id: 'gulkand', name: 'Gulkand', price: 25, profitPerUnit: 9, image: `${FLAVOR_BASE_URL}gulkand_kulfi.png` },
  { id: 'pineapple', name: 'Pineapple', price: 25, profitPerUnit: 6, image: `${FLAVOR_BASE_URL}pineapple_kulfi.png` },
  { id: 'red-peru', name: 'Red Peru', price: 25, profitPerUnit: 6, image: `${FLAVOR_BASE_URL}guava_kulfi.png` },
  { id: 'jamun', name: 'Jamun', price: 25, profitPerUnit: 6, image: `${FLAVOR_BASE_URL}jamun_kulfi.png` },
  { id: 'chikoo', name: 'Chikoo', price: 25, profitPerUnit: 6, image: `${FLAVOR_BASE_URL}chikoo_kulfi.png` },
  { id: 'anjeer', name: 'Anjeer', price: 30, profitPerUnit: 6, image: `${FLAVOR_BASE_URL}fig_kulfi.png` },
  { id: 'mava', name: 'Mava Kulfi', price: 25, profitPerUnit: 6, image: `${LOCAL_FLAVOR_BASE}mava_kulfi.png` },
  { id: 'butterscotch', name: 'Butterscotch', price: 25, profitPerUnit: 6, image: `${LOCAL_FLAVOR_BASE}butterscotch_kulfi.png` },
]

export const getProductsForShop = (shopId = DEFAULT_SHOP_ID) => {
  const shop = SHOP_BY_ID[shopId] || SHOP_BY_ID[DEFAULT_SHOP_ID]
  return PRODUCTS.map((product) => ({
    ...product,
    price: product.id === 'small-rabdi' ? product.price : product.price + (shop?.priceAdjustment || 0),
  }))
}

export const LOGO_URL = 'https://aditilekar.github.io/ShreeGaneshKulfi.github.io/images/logo.png'
