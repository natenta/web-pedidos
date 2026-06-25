import { CONFIG } from './config';
import { FocacciaOrder } from './models/FocacciaOrder';
import { Cart } from './models/Cart';
import type { DeliveryMethod, CustomerDetails, ShippingZone } from './types';
import { searchAddress, resolveShippingZone } from './geo';
import type { Suggestion, ShippingResult } from './geo';

const FINISHING_ICONS: Record<string, string> = {
  pesto: '🌿',
  aceite_oliva: '🫗',
  almibar: '🍯',
  romero: '🌱',
  sal_gruesa: '🧂'
};

const cart = new Cart();
const currentItem = new FocacciaOrder();

// Estado para la dirección seleccionada del autocompletado
let selectedSuggestion: Suggestion | null = null;
let currentShippingZone: ShippingZone | null = null;
let currentShippingDistance: number | null = null;

const gridComun = document.getElementById('grid-comun') as HTMLDivElement;
const gridPremium = document.getElementById('grid-premium') as HTMLDivElement;
const gridDeluxe = document.getElementById('grid-deluxe') as HTMLDivElement;

const sizeChicaRadio = document.getElementById('size-chica') as HTMLInputElement;
const sizeGrandeRadio = document.getElementById('size-grande') as HTMLInputElement;

const customerNameInput = document.getElementById('customer-name') as HTMLInputElement;

const deliveryPickupRadio = document.getElementById('delivery-pickup') as HTMLInputElement;
const deliveryShippingRadio = document.getElementById('delivery-shipping') as HTMLInputElement;
const deliveryInfo = document.getElementById('delivery-info') as HTMLDivElement;

const shippingFields = document.getElementById('shipping-fields') as HTMLDivElement;
const shippingAddressInput = document.getElementById('shipping-address') as HTMLInputElement;
const shippingFloorInput = document.getElementById('shipping-floor') as HTMLInputElement;
const shippingApartmentInput = document.getElementById('shipping-apartment') as HTMLInputElement;
const shippingTowerInput = document.getElementById('shipping-tower') as HTMLInputElement;
const shippingDateSelect = document.getElementById('shipping-date') as HTMLSelectElement;
const addressSuggestions = document.getElementById('address-suggestions') as HTMLDivElement;
const pickupFields = document.getElementById('pickup-fields') as HTMLDivElement;
const pickupDateSelect = document.getElementById('pickup-date') as HTMLSelectElement;
const shippingZoneInfo = document.getElementById('shipping-zone-info') as HTMLDivElement;
const shippingZoneWarning = document.getElementById('shipping-zone-warning') as HTMLDivElement;
const shippingFieldsInner = document.getElementById('shipping-fields-inner') as HTMLDivElement;

const paymentCashRadio = document.getElementById('payment-cash') as HTMLInputElement;
const paymentTransferRadio = document.getElementById('payment-transfer') as HTMLInputElement;

const summaryTotalPriceSpan = document.getElementById('summary-total-price') as HTMLSpanElement;
const btnSubmitOrder = document.getElementById('btn-submit-order') as HTMLButtonElement;

const btnAddToCart = document.getElementById('btn-add-to-cart') as HTMLButtonElement;
const sectionCart = document.getElementById('section-cart') as HTMLElement;
const cartItemsDiv = document.getElementById('cart-items') as HTMLDivElement;
const cartEmptyDiv = document.getElementById('cart-empty') as HTMLDivElement;
const panelItemsCount = document.getElementById('panel-items-count') as HTMLSpanElement;
const sectionDetails = document.getElementById('section-details') as HTMLElement;

const gridFinishing = document.getElementById('grid-finishing') as HTMLDivElement;

const currentPreview = document.getElementById('current-preview') as HTMLDivElement;
const previewPrice = document.getElementById('preview-price') as HTMLSpanElement;
const previewSize = document.getElementById('preview-size') as HTMLSpanElement;
const previewToppings = document.getElementById('preview-toppings') as HTMLSpanElement;
const previewFinishing = document.getElementById('preview-finishing') as HTMLSpanElement;

function renderToppings() {
  gridComun.innerHTML = '';
  gridPremium.innerHTML = '';
  gridDeluxe.innerHTML = '';

  CONFIG.TOPPINGS_LIST.forEach(topping => {
    const card = document.createElement('label');
    card.className = 'topping-card';
    card.setAttribute('data-category', topping.category);
    card.setAttribute('for', `chk-${topping.id}`);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `chk-${topping.id}`;
    checkbox.value = topping.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'topping-name';
    nameSpan.textContent = topping.name;

    const priceSpan = document.createElement('span');
    priceSpan.className = 'topping-price';
    priceSpan.id = `price-${topping.id}`;
    priceSpan.textContent = '';

    card.appendChild(checkbox);
    card.appendChild(nameSpan);
    card.appendChild(priceSpan);

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        currentItem.addTopping(topping);
        card.classList.add('active');
      } else {
        currentItem.removeTopping(topping.id);
        card.classList.remove('active');
      }
      updateUI();
    });

    if (topping.category === 'Común') {
      gridComun.appendChild(card);
    } else if (topping.category === 'Premium') {
      gridPremium.appendChild(card);
    } else if (topping.category === 'Deluxe') {
      gridDeluxe.appendChild(card);
    }
  });
}

function renderFinishingOptions() {
  gridFinishing.innerHTML = '';

  CONFIG.FINISHING_OPTIONS.forEach(opt => {
    const card = document.createElement('label');
    card.className = 'finishing-card';
    card.setAttribute('for', `finishing-${opt.id}`);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `finishing-${opt.id}`;
    checkbox.value = opt.id;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'finishing-icon';
    iconSpan.textContent = FINISHING_ICONS[opt.id] || '✨';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'finishing-name';
    nameSpan.textContent = opt.name;

    const freeSpan = document.createElement('span');
    freeSpan.className = 'finishing-price';
    freeSpan.textContent = 'Sin cargo';

    card.appendChild(checkbox);
    card.appendChild(iconSpan);
    card.appendChild(nameSpan);
    card.appendChild(freeSpan);

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        currentItem.toggleFinishing(opt.name);
        card.classList.add('active');
      } else {
        currentItem.toggleFinishing(opt.name);
        card.classList.remove('active');
      }
      updateUI();
    });

    gridFinishing.appendChild(card);
  });
}

function populateDates() {
  shippingDateSelect.innerHTML = '';
  CONFIG.DELIVERY_DAYS.forEach((day: string) => {
    const opt = document.createElement('option');
    opt.value = day;
    opt.textContent = `${day} (Reparto a domicilio)`;
    shippingDateSelect.appendChild(opt);
  });

  pickupDateSelect.innerHTML = '';
  CONFIG.PICKUP_DAYS.forEach((day: string) => {
    const opt = document.createElement('option');
    opt.value = day;
    opt.textContent = `${day} (Retiro por Parque Centenario)`;
    pickupDateSelect.appendChild(opt);
  });
}

function renderCart() {
  cartItemsDiv.innerHTML = '';
  const items = cart.getItems();

  if (items.length === 0) {
    cartEmptyDiv.classList.remove('hidden');
    sectionCart.classList.add('hidden');
    sectionDetails.classList.add('hidden');
    return;
  }

  cartEmptyDiv.classList.add('hidden');
  sectionCart.classList.remove('hidden');
  sectionDetails.classList.remove('hidden');

  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const title = document.createElement('div');
    title.className = 'cart-item-title';
    const sizeEmoji = item.getSize() === 'Grande' ? '🐘' : '🫓';
    title.textContent = `${sizeEmoji} Focaccia ${item.getSize()} - ${item.detectCategory()}`;

    const toppings = document.createElement('div');
    toppings.className = 'cart-item-toppings';
    const t = item.getToppings();
    toppings.textContent = t.length > 0 ? t.map(tp => tp.name).join(', ') : 'Solo base';

    info.appendChild(title);
    info.appendChild(toppings);

    // Terminación en el carrito
    const finishingList = item.getFinishing();
    if (finishingList.length > 0) {
      const finEl = document.createElement('div');
      finEl.className = 'cart-item-finishing';
      const parts = finishingList.map(name => {
        const opt = CONFIG.FINISHING_OPTIONS.find(o => o.name === name);
        const icon = opt ? (FINISHING_ICONS[opt.id] || '🧂') : '🧂';
        return `${icon} ${name}`;
      });
      finEl.textContent = `Terminación: ${parts.join(' · ')}`;
      info.appendChild(finEl);
    }

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = `$${item.calculateTotal().toLocaleString('es-AR')}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cart-item-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      cart.removeItem(index);
      renderCart();
      updateUI();
    });

    row.appendChild(info);
    row.appendChild(price);
    row.appendChild(removeBtn);
    cartItemsDiv.appendChild(row);
  });

  const totalLine = document.createElement('div');
  totalLine.className = 'cart-total-line';
  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Total Pedido:';
  const totalPrice = document.createElement('span');
  totalPrice.className = 'cart-item-price';
  totalPrice.textContent = `$${cart.calculateTotal().toLocaleString('es-AR')}`;
  totalLine.appendChild(totalLabel);
  totalLine.appendChild(totalPrice);
  cartItemsDiv.appendChild(totalLine);
}

function resetCurrentItem() {
  currentItem.clearAll();
  currentItem.setSize('Chica');
  sizeChicaRadio.checked = true;

  document.querySelectorAll('.topping-card').forEach(card => {
    card.classList.remove('active');
    const chk = card.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (chk) chk.checked = false;
  });

  document.querySelectorAll('.finishing-card').forEach(card => {
    card.classList.remove('active');
    const chk = card.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (chk) chk.checked = false;
  });
}

// ---------------------------------------------------------------------------
// Autocompletado de direcciones con OpenStreetMap Nominatim
// ---------------------------------------------------------------------------

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function renderSuggestions(suggestions: Suggestion[]) {
  addressSuggestions.innerHTML = '';

  if (suggestions.length === 0) {
    addressSuggestions.classList.add('hidden');
    return;
  }

  suggestions.forEach(s => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'suggestion-item';

    // Resaltar la parte del display que coincide con la calle + altura
    const titleEl = document.createElement('span');
    titleEl.className = 'suggestion-title';
    const streetParts = [s.housenumber, s.street].filter(Boolean).join(' ');
    titleEl.textContent = streetParts || s.displayName.split(',')[0];

    const detailEl = document.createElement('span');
    detailEl.className = 'suggestion-detail';
    detailEl.textContent = [s.suburb, 'CABA'].filter(Boolean).join(', ');

    item.appendChild(titleEl);
    item.appendChild(detailEl);

    item.addEventListener('click', () => {
      selectSuggestion(s);
    });

    addressSuggestions.appendChild(item);
  });

  addressSuggestions.classList.remove('hidden');
}

function selectSuggestion(s: Suggestion) {
  selectedSuggestion = s;
  shippingAddressInput.value = s.displayName;
  addressSuggestions.classList.add('hidden');

  const result = resolveShippingZone(s);
  currentShippingZone = result.zone;
  currentShippingDistance = result.distanceKm;

  updateShippingZoneUI();
  updateUI();
}

function resetAddressState() {
  selectedSuggestion = null;
  currentShippingZone = null;
  currentShippingDistance = null;
  addressSuggestions.classList.add('hidden');
  shippingZoneInfo.classList.add('hidden');
  shippingZoneWarning.classList.add('hidden');
  if (shippingFieldsInner) shippingFieldsInner.classList.remove('hidden');
}

// Buscar direcciones con debounce
const debouncedSearch = debounce(async (query: string) => {
  // Si es modo envío, buscamos sugerencias
  if (!deliveryShippingRadio.checked) return;

  const suggestions = await searchAddress(query);
  renderSuggestions(suggestions);
}, 400);

// ---------------------------------------------------------------------------
// Fin autocompletado
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Preview del item actual (lo que está armando el usuario)
// ---------------------------------------------------------------------------

function updateCurrentPreview() {
  const currentSize = sizeGrandeRadio.checked ? 'Grande' : 'Chica';
  const total = currentItem.calculateTotal();

  previewPrice.textContent = `$${total.toLocaleString('es-AR')}`;
  previewSize.textContent = `Focaccia ${currentSize}`;

  const toppings = currentItem.getToppings();
  if (toppings.length === 0) {
    previewToppings.textContent = 'Solo base (sin toppings extras)';
  } else {
    previewToppings.textContent = toppings.map(t => t.name).join(', ');
  }

  // Mostrar la(s) terminación(es) seleccionada(s) en el preview
  const finishingList = currentItem.getFinishing();
  if (finishingList.length > 0) {
    const parts = finishingList.map(name => {
      const opt = CONFIG.FINISHING_OPTIONS.find(o => o.name === name);
      const icon = opt ? (FINISHING_ICONS[opt.id] || '✨') : '✨';
      return `${icon} ${name}`;
    });
    previewFinishing.textContent = `Terminación: ${parts.join(' · ')}`;
    previewFinishing.classList.remove('hidden');
  } else {
    previewFinishing.classList.add('hidden');
  }

  currentPreview.classList.remove('hidden');
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Precios dinámicos según tamaño seleccionado
// ---------------------------------------------------------------------------

function updateToppingPrices() {
  const currentSize = sizeGrandeRadio.checked ? 'Grande' : 'Chica';
  const comunes = currentItem.getToppings().filter(t => t.category === 'Común');
  const precioComun = CONFIG.TOPPING_EXTRA_PRICES['Común'][currentSize];
  const precioPremium = CONFIG.TOPPING_EXTRA_PRICES['Premium'][currentSize];
  const precioDeluxe = CONFIG.TOPPING_EXTRA_PRICES['Deluxe'][currentSize];

  // Precio por categoría en el título del grupo
  const hintComun = document.getElementById('hint-comun');
  if (hintComun) hintComun.textContent = `Extra: +$${precioComun.toLocaleString('es-AR')}`;
  const hintPremium = document.getElementById('hint-premium');
  if (hintPremium) hintPremium.textContent = `Extra: +$${precioPremium.toLocaleString('es-AR')}`;
  const hintDeluxe = document.getElementById('hint-deluxe');
  if (hintDeluxe) hintDeluxe.textContent = `Extra: +$${precioDeluxe.toLocaleString('es-AR')}`;

  // Precio individual de cada tarjeta
  CONFIG.TOPPINGS_LIST.forEach(topping => {
    const priceSpan = document.getElementById(`price-${topping.id}`);
    if (!priceSpan) return;

    const isChecked = currentItem.getToppings().some(t => t.id === topping.id);

    if (topping.category === 'Común') {
      if (isChecked) {
        // Buscar qué número de común es (ordenado por como aparecen en getToppings)
        const idx = comunes.findIndex(t => t.id === topping.id);
        if (idx >= 2) {
          priceSpan.textContent = `+$${precioComun.toLocaleString('es-AR')}`;
          priceSpan.className = 'topping-price has-cost';
        } else {
          priceSpan.textContent = 'Sin cargo ✓';
          priceSpan.className = 'topping-price free';
        }
      } else {
        priceSpan.textContent = '';
        priceSpan.className = 'topping-price';
      }
    } else {
      // Premium / Deluxe — siempre muestran el precio
      const price = topping.category === 'Premium' ? precioPremium : precioDeluxe;
      priceSpan.textContent = `+$${price.toLocaleString('es-AR')}`;
      priceSpan.className = 'topping-price has-cost';
    }
  });
}

// ---------------------------------------------------------------------------

function updateShippingZoneUI() {
  if (!currentShippingZone) {
    shippingZoneInfo.classList.add('hidden');
    shippingZoneWarning.classList.add('hidden');
    if (shippingFieldsInner) shippingFieldsInner.classList.remove('hidden');
    return;
  }

  const cartTotal = cart.calculateTotal();

  if (currentShippingZone === 'outside_caba') {
    shippingZoneWarning.classList.remove('hidden');
    shippingZoneInfo.classList.add('hidden');
    if (shippingFieldsInner) shippingFieldsInner.classList.add('hidden');
    shippingZoneWarning.innerHTML = `⚠️ La dirección está fuera de CABA. <strong>No realizamos envíos fuera de la ciudad</strong>. Podés retirar tu pedido en <strong>Parque Centenario</strong>.`;
    return;
  }

  shippingZoneWarning.classList.add('hidden');
  if (shippingFieldsInner) shippingFieldsInner.classList.remove('hidden');
  shippingZoneInfo.classList.remove('hidden');

  if (currentShippingZone === 'within_3km') {
    shippingZoneInfo.className = 'delivery-info delivery-info-free';
    shippingZoneInfo.innerHTML = `✅ <strong>Envío gratis</strong> — estás dentro de la zona de cobertura.`;
  } else if (currentShippingZone === 'caba') {
    if (cartTotal >= CONFIG.MIN_DELIVERY_AMOUNT) {
      shippingZoneInfo.className = 'delivery-info delivery-info-free';
      shippingZoneInfo.innerHTML = `🎉 Tu pedido supera los <strong>$${CONFIG.MIN_DELIVERY_AMOUNT.toLocaleString('es-AR')}</strong> — <strong>envío gratis</strong>.`;
    } else {
      const missing = CONFIG.MIN_DELIVERY_AMOUNT - cartTotal;
      shippingZoneInfo.className = 'delivery-info delivery-info-pay';
      shippingZoneInfo.innerHTML = `📦 Costo de envío <strong>a convenir</strong>. Te faltan <strong>$${missing.toLocaleString('es-AR')}</strong> para envío gratis.`;
    }
  }
}

function updateUI() {
  const currentSize = sizeGrandeRadio.checked ? 'Grande' : 'Chica';
  currentItem.setSize(currentSize);

  updateToppingPrices();

  const cartTotal = cart.calculateTotal();
  const count = cart.getItemCount();
  summaryTotalPriceSpan.textContent = `$${cartTotal.toLocaleString('es-AR')}`;
  panelItemsCount.textContent = count === 0 ? 'Sin items' : `${count} focaccia${count !== 1 ? 's' : ''}`;

  updateCurrentPreview();

  if (deliveryShippingRadio.checked) {
    updateShippingZoneUI();
    deliveryInfo.classList.add('hidden');
  } else {
    shippingZoneInfo.classList.add('hidden');
    shippingZoneWarning.classList.add('hidden');
    if (shippingFieldsInner) shippingFieldsInner.classList.remove('hidden');

    const isFreeDelivery = cartTotal >= CONFIG.MIN_DELIVERY_AMOUNT;
    if (isFreeDelivery) {
      deliveryInfo.className = 'delivery-info delivery-info-free';
      deliveryInfo.innerHTML = `🎉 Envío a domicilio gratis por compras mayores a <strong>$${CONFIG.MIN_DELIVERY_AMOUNT.toLocaleString('es-AR')}</strong>`;
      deliveryInfo.classList.remove('hidden');
    } else {
      const missing = CONFIG.MIN_DELIVERY_AMOUNT - cartTotal;
      deliveryInfo.className = 'delivery-info delivery-info-pay';
      deliveryInfo.innerHTML = `📦 Los envíos a domicilio son en <strong>CABA</strong>.`;
      deliveryInfo.classList.remove('hidden');
    }
  }
}

function toggleDeliveryFields(method: DeliveryMethod) {
  if (method === 'envio') {
    shippingFields.classList.remove('hidden');
    shippingAddressInput.setAttribute('required', 'true');
    pickupFields.classList.add('hidden');
    deliveryInfo.classList.add('hidden');
  } else {
    shippingFields.classList.add('hidden');
    shippingAddressInput.removeAttribute('required');
    pickupFields.classList.remove('hidden');
    deliveryInfo.classList.add('hidden');
    resetAddressState();
  }
}

function setupEventListeners() {
  sizeChicaRadio.addEventListener('change', updateUI);
  sizeGrandeRadio.addEventListener('change', updateUI);

  deliveryPickupRadio.addEventListener('change', () => {
    if (deliveryPickupRadio.checked) {
      toggleDeliveryFields('retiro');
    }
  });

  deliveryShippingRadio.addEventListener('change', () => {
    if (deliveryShippingRadio.checked) {
      toggleDeliveryFields('envio');
    }
  });

  btnAddToCart.addEventListener('click', () => {
    const item = new FocacciaOrder();
    item.setSize(currentItem.getSize());
    currentItem.getToppings().forEach(t => item.addTopping(t));
    currentItem.getFinishing().forEach(name => item.toggleFinishing(name));
    cart.addItem(item);
    renderCart();
    resetCurrentItem();
    updateUI();
  });

  btnSubmitOrder.addEventListener('click', submitOrder);

  // Autocompletado de dirección
  shippingAddressInput.addEventListener('input', () => {
    resetAddressState();
    debouncedSearch(shippingAddressInput.value);
  });

  // WhatsApp contacto (mobile + desktop)
  function handleContactWhatsappClick() {
    const msg = encodeURIComponent('Hola me comunico desde el sitio de pedidos, quiero consultarte algo');
    window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  }
  document.getElementById('contact-whatsapp-desktop')?.addEventListener('click', handleContactWhatsappClick);
  document.getElementById('contact-whatsapp-mobile')?.addEventListener('click', handleContactWhatsappClick);

  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!(e.target as Element)?.closest('.address-input-wrapper')) {
      addressSuggestions.classList.add('hidden');
    }
  });

  // Prevenir que el formulario recargue la página
  document.getElementById('order-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
  });
}

function submitOrder() {
  if (cart.getItemCount() === 0) {
    alert('Agregá al menos una focaccia al pedido.');
    return;
  }

  const name = customerNameInput.value.trim();
  if (!name) {
    alert('Por favor, ingresá tu Nombre y Apellido.');
    customerNameInput.focus();
    return;
  }

  const deliveryMethod = deliveryShippingRadio.checked ? 'envio' : 'retiro';
  let address = '';
  let deliveryDate = '';

  if (deliveryMethod === 'envio') {
    address = shippingAddressInput.value.trim();
    if (!address) {
      alert('Por favor, ingresá la Dirección Completa para el envío.');
      shippingAddressInput.focus();
      return;
    }
    if (!selectedSuggestion || !currentShippingZone) {
      alert('Por favor, seleccioná una dirección de las sugerencias para que podamos calcular el envío.');
      shippingAddressInput.focus();
      return;
    }
    if (currentShippingZone === 'outside_caba') {
      alert('No realizamos envíos fuera de CABA. Por favor, seleccioná "Retiro en Parque Centenario" para completar tu pedido.');
      return;
    }
    deliveryDate = shippingDateSelect.value;
  } else {
    deliveryDate = pickupDateSelect.value;
  }

  const paymentMethod = paymentTransferRadio.checked ? 'transferencia' : 'efectivo';

  const floor = shippingFloorInput.value.trim() || undefined;
  const apartment = shippingApartmentInput.value.trim() || undefined;
  const tower = shippingTowerInput.value.trim() || undefined;

  const details: CustomerDetails = {
    name,
    deliveryMethod,
    address: deliveryMethod === 'envio' ? address : undefined,
    floor,
    apartment,
    tower,
    deliveryDate,
    paymentMethod,
    shippingZone: deliveryMethod === 'envio' ? currentShippingZone ?? undefined : undefined,
  };

  cart.setCustomerDetails(details);

  const encodedMsg = cart.generateWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMsg}`;

  window.open(whatsappUrl, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  renderToppings();
  renderFinishingOptions();
  populateDates();
  setupEventListeners();
  renderCart();
  updateUI();
});
