import { CONFIG } from './config';
import { FocacciaOrder } from './models/FocacciaOrder';
import { Cart } from './models/Cart';
import type { DeliveryMethod, CustomerDetails } from './types';

const cart = new Cart();
const currentItem = new FocacciaOrder();

const gridComun = document.getElementById('grid-comun') as HTMLDivElement;
const gridPremium = document.getElementById('grid-premium') as HTMLDivElement;
const gridDeluxe = document.getElementById('grid-deluxe') as HTMLDivElement;

const sizeChicaRadio = document.getElementById('size-chica') as HTMLInputElement;
const sizeGrandeRadio = document.getElementById('size-grande') as HTMLInputElement;

const customerNameInput = document.getElementById('customer-name') as HTMLInputElement;

const deliveryPickupRadio = document.getElementById('delivery-pickup') as HTMLInputElement;
const deliveryShippingRadio = document.getElementById('delivery-shipping') as HTMLInputElement;
const deliveryShippingLabel = document.getElementById('delivery-shipping-label') as HTMLLabelElement;

const deliveryWarningMsg = document.getElementById('delivery-warning-msg') as HTMLDivElement;
const deliveryMinAmountSpan = document.getElementById('delivery-min-amount') as HTMLSpanElement;
const deliveryMissingAmountSpan = document.getElementById('delivery-missing-amount') as HTMLSpanElement;

const shippingFields = document.getElementById('shipping-fields') as HTMLDivElement;
const shippingAddressInput = document.getElementById('shipping-address') as HTMLInputElement;
const shippingDateSelect = document.getElementById('shipping-date') as HTMLSelectElement;

const pickupFields = document.getElementById('pickup-fields') as HTMLDivElement;
const pickupDateSelect = document.getElementById('pickup-date') as HTMLSelectElement;

const paymentCashRadio = document.getElementById('payment-cash') as HTMLInputElement;
const paymentTransferRadio = document.getElementById('payment-transfer') as HTMLInputElement;

const summaryTotalPriceSpan = document.getElementById('summary-total-price') as HTMLSpanElement;
const btnSubmitOrder = document.getElementById('btn-submit-order') as HTMLButtonElement;

const btnAddToCart = document.getElementById('btn-add-to-cart') as HTMLButtonElement;
const cartPanelItems = document.getElementById('cart-panel-items') as HTMLDivElement;
const cartPanelEmpty = document.getElementById('cart-panel-empty') as HTMLDivElement;
const sectionDetails = document.getElementById('section-details') as HTMLElement;

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

    card.appendChild(checkbox);
    card.appendChild(nameSpan);

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
  cartPanelItems.innerHTML = '';
  const items = cart.getItems();

  if (items.length === 0) {
    cartPanelEmpty.classList.remove('hidden');
    sectionDetails.classList.add('hidden');
    return;
  }

  cartPanelEmpty.classList.add('hidden');
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
    cartPanelItems.appendChild(row);
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
  cartPanelItems.appendChild(totalLine);
}

function resetCurrentItem() {
  currentItem.clearToppings();
  currentItem.setSize('Chica');
  sizeChicaRadio.checked = true;

  document.querySelectorAll('.topping-card').forEach(card => {
    card.classList.remove('active');
    const chk = card.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (chk) chk.checked = false;
  });
}

function updateUI() {
  const currentSize = sizeGrandeRadio.checked ? 'Grande' : 'Chica';
  currentItem.setSize(currentSize);

  const cartTotal = cart.calculateTotal();
  summaryTotalPriceSpan.textContent = `$${cartTotal.toLocaleString('es-AR')}`;
  const isDeliveryAllowed = cartTotal >= CONFIG.MIN_DELIVERY_AMOUNT;
  deliveryMinAmountSpan.textContent = `$${CONFIG.MIN_DELIVERY_AMOUNT.toLocaleString('es-AR')}`;

  if (isDeliveryAllowed) {
    deliveryShippingLabel.classList.remove('disabled');
    deliveryWarningMsg.classList.add('hidden');
  } else {
    deliveryShippingLabel.classList.add('disabled');

    if (deliveryShippingRadio.checked) {
      deliveryPickupRadio.checked = true;
      toggleDeliveryFields('retiro');
    }

    const missing = CONFIG.MIN_DELIVERY_AMOUNT - cartTotal;
    deliveryMissingAmountSpan.textContent = `$${missing.toLocaleString('es-AR')}`;
    deliveryWarningMsg.classList.remove('hidden');
  }
}

function toggleDeliveryFields(method: DeliveryMethod) {
  if (method === 'envio') {
    shippingFields.classList.remove('hidden');
    shippingAddressInput.setAttribute('required', 'true');
    pickupFields.classList.add('hidden');
  } else {
    shippingFields.classList.add('hidden');
    shippingAddressInput.removeAttribute('required');
    pickupFields.classList.remove('hidden');
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
      if (!cart.isDeliveryAllowed()) {
        deliveryPickupRadio.checked = true;
        alert(`¡Ups! El mínimo de compra para envíos es de $${CONFIG.MIN_DELIVERY_AMOUNT.toLocaleString('es-AR')}. Agregá más toppings para habilitarlo.`);
        return;
      }
      toggleDeliveryFields('envio');
    }
  });

  btnAddToCart.addEventListener('click', () => {
    const item = new FocacciaOrder();
    item.setSize(currentItem.getSize());
    currentItem.getToppings().forEach(t => item.addTopping(t));
    cart.addItem(item);
    renderCart();
    resetCurrentItem();
    updateUI();
  });

  btnSubmitOrder.addEventListener('click', submitOrder);
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
    deliveryDate = shippingDateSelect.value;
  } else {
    deliveryDate = pickupDateSelect.value;
  }

  const paymentMethod = paymentTransferRadio.checked ? 'transferencia' : 'efectivo';

  const details: CustomerDetails = {
    name,
    deliveryMethod,
    address: deliveryMethod === 'envio' ? address : undefined,
    deliveryDate,
    paymentMethod
  };

  cart.setCustomerDetails(details);

  const encodedMsg = cart.generateWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMsg}`;

  window.open(whatsappUrl, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  renderToppings();
  populateDates();
  setupEventListeners();
  renderCart();
  updateUI();
});
