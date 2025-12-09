
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function toCurrency(n) {
  if (n == null || Number.isNaN(Number(n))) return "N/A";
  return `NRs ${Number(n).toFixed(2)}`;
}


export function computeOrderTotals(order = {}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsTotal = items.reduce((sum, it) => {
    const price = Number(it.price ?? it.unitPrice ?? 0);
    const qty = Number(it.qty ?? it.quantity ?? 1);
    if (!isFinite(price) || !isFinite(qty)) return sum;
    return sum + price * qty;
  }, 0);

  const deliveryCharge = Number(order.deliveryCharge ?? order.shipping ?? 0) || 0;
  const tax = Number(order.tax ?? 0) || 0;
  const discount = Number(order.discount ?? 0) || 0;

  const subTotal = itemsTotal;
  const total = subTotal + deliveryCharge + tax - discount;

  return {
    itemsTotal,
    deliveryCharge,
    tax,
    discount,
    subTotal,
    total,
  };
}


export function buildItemsHtmlTable(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<tr><td colspan="4" style="padding:6px;border:1px solid #e6e6e6;">No items</td></tr>`;
  }

  return items
    .map((it) => {
      const name = escapeHtml(it.name ?? it.title ?? it.productName ?? "Item");
      const qty = Number(it.qty ?? it.quantity ?? 1);
      const price = Number(it.price ?? it.unitPrice ?? 0);
      const lineTotal = price * qty;
      return `<tr>
        <td style="padding:6px;border:1px solid #e6e6e6;">${name}</td>
        <td style="padding:6px;border:1px solid #e6e6e6;text-align:center;">${qty}</td>
        <td style="padding:6px;border:1px solid #e6e6e6;text-align:right;">${toCurrency(price)}</td>
        <td style="padding:6px;border:1px solid #e6e6e6;text-align:right;">${toCurrency(lineTotal)}</td>
      </tr>`;
    })
    .join("");
}


function wrapHtml(bodyHtml) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.4;">
      <div style="max-width:680px;margin:0 auto;padding:18px;">
        <div style="padding:12px 0;border-bottom:1px solid #eee;margin-bottom:18px;">
          <h2 style="margin:0">Best HaatBazar</h2>
        </div>
        <div>${bodyHtml}</div>
        <div style="margin-top:18px;padding-top:12px;border-top:1px solid #eee;color:#666;font-size:13px;">
          <div>Thanks for shopping with Best HaatBazar.</div>
          <div>If you have questions, reply to this email or contact support.</div>
        </div>
      </div>
    </div>
  `;
}


export function orderCreatedTemplate(order = {}) {
  const name = escapeHtml(order.user?.name ?? order.customerName ?? "Customer");
  const orderId = escapeHtml(String(order._id ?? order.id ?? "N/A"));
  const createdAt = order.createdAt ? escapeHtml(new Date(order.createdAt).toLocaleString()) : "";
  const { itemsTotal, deliveryCharge, tax, discount, total } = computeOrderTotals(order);

  const itemsTableRows = buildItemsHtmlTable(order.items);

  const body = `
    <p>Hi ${name},</p>
    <p>Thank you for your order. We received your order <strong>#${orderId}</strong> ${createdAt ? `on ${createdAt}` : ""}.</p>

    <table style="width:100%;border-collapse:collapse;margin-top:10px;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="text-align:left;padding:6px;border:1px solid #e6e6e6;">Item</th>
          <th style="padding:6px;border:1px solid #e6e6e6;text-align:center;">Qty</th>
          <th style="padding:6px;border:1px solid #e6e6e6;text-align:right;">Unit</th>
          <th style="padding:6px;border:1px solid #e6e6e6;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTableRows}
      </tbody>
    </table>

    <div style="margin-top:12px;text-align:right;">
      <div>Items total: <strong>${toCurrency(itemsTotal)}</strong></div>
      <div>Delivery: <strong>${toCurrency(deliveryCharge)}</strong></div>
      <div>Tax: <strong>${toCurrency(tax)}</strong></div>
      ${discount ? `<div>Discount: <strong>-${toCurrency(discount)}</strong></div>` : ""}
      <div style="font-size:18px;margin-top:8px;">Order Total: <strong>${toCurrency(total)}</strong></div>
    </div>

    <p style="margin-top:14px;">We will notify you when your order is shipped.</p>
  `;

  return wrapHtml(body);
}

/**
 * Order Updated template
 */
export function orderUpdatedTemplate(order = {}) {
  const name = escapeHtml(order.user?.name ?? order.customerName ?? "Customer");
  const orderId = escapeHtml(String(order._id ?? order.id ?? "N/A"));
  const status = escapeHtml(order.status ?? "updated");
  const { itemsTotal, deliveryCharge, tax, discount, total } = computeOrderTotals(order);
  const itemsTableRows = buildItemsHtmlTable(order.items);

  const body = `
    <p>Hi ${name},</p>
    <p>Your order <strong>#${orderId}</strong> status has been updated to <strong>${status}</strong>.</p>

    <table style="width:100%;border-collapse:collapse;margin-top:10px;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="text-align:left;padding:6px;border:1px solid #e6e6e6;">Item</th>
          <th style="padding:6px;border:1px solid #e6e6e6;text-align:center;">Qty</th>
          <th style="padding:6px;border:1px solid #e6e6e6;text-align:right;">Unit</th>
          <th style="padding:6px;border:1px solid #e6e6e6;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTableRows}
      </tbody>
    </table>

    <div style="margin-top:12px;text-align:right;">
      <div>Items total: <strong>${toCurrency(itemsTotal)}</strong></div>
      <div>Delivery: <strong>${toCurrency(deliveryCharge)}</strong></div>
      <div>Tax: <strong>${toCurrency(tax)}</strong></div>
      ${discount ? `<div>Discount: <strong>-${toCurrency(discount)}</strong></div>` : ""}
      <div style="font-size:18px;margin-top:8px;">Order Total: <strong>${toCurrency(total)}</strong></div>
    </div>
  `;

  return wrapHtml(body);
}


export function orderDeletedTemplate(order = {}) {
  const name = escapeHtml(order.user?.name ?? order.customerName ?? "Customer");
  const orderId = escapeHtml(String(order._id ?? order.id ?? "N/A"));
  const body = `
    <p>Hi ${name},</p>
    <p>Your order <strong> #${orderId}</strong> has been deleted from our system.</p>
    <p>If you did not request this, please contact support immediately.</p>
    <p>We didnot store your data longer, we concern about your privacy.</p>
    <a href="http://localhost:5173/"> Visit Website</a>

  `;

  return wrapHtml(body);
}
