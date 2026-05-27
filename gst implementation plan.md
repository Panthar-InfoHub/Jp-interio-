# Optional GST Number During Checkout

## Summary
Add an optional **GST Number** field to checkout, store it as part of the order snapshot, and display it in order details/admin emails where billing information is shown. No Prisma migration is needed because billing/shipping addresses are stored as JSON.

## Key Changes

### Checkout UI
- Update `components/store/checkout/checkout-form.tsx`.
- Add `gstNumber` to checkout form state, initialized as `""`.
- Render a field labeled `GST Number (optional)` near the billing section:
  - Best placement: directly below the “Use the same address as billing address” checkbox.
  - Keep it visible regardless of whether billing address is same or separate, because GST is billing/tax metadata and should not require opening the billing-address form.
- Normalize input on change:
  - trim spaces
  - convert to uppercase
  - optionally remove internal spaces.

### Validation / Payload
- Update `lib/zod-schema.ts`.
- Add optional `gstNumber` to the checkout/order address schema:
  - optional empty string allowed on the client.
  - if provided, validate as a 15-character Indian GSTIN.
  - recommended regex:
    ```ts
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
    ```
- Add `gstNumber?: string` to `addressSchema` so `billingAddress.gstNumber` is accepted by `orderDetailsSchema`.
- On submit in checkout:
  - build `gstNumber = formData.gstNumber?.trim().toUpperCase() || undefined`.
  - attach it to `billingAddressDetails`.
  - do not attach it to `shippingAddress` unless you deliberately want both JSON objects to contain it.
- Keep GST optional; missing GST must not block checkout.

### Storage
- Store GST as:
  ```ts
  billingAddress: {
    ...billingAddressDetails,
    gstNumber
  }
  ```
- Do not add a database column unless you later need GST search/reporting/filtering.
- Existing orders remain compatible because old `billingAddress` objects simply will not have `gstNumber`.

### Order Display
- Update billing-address display blocks in:
  - `components/admin/orders/order-details-dialog.tsx`
  - `components/store/account/modern-orders-list.tsx`
  - `components/store/account/orders-list.tsx`
- Under Billing Address, show:
  ```txt
  GST: <gstNumber>
  ```
  only when `billingAddress?.gstNumber` exists.
- Do not show an empty GST row for old orders or customers who did not enter GST.

### Emails
- Update formatting in:
  - `actions/payment/confirm-order.ts`
  - `app/api/webhooks/razorpay/route.ts`
  - `templates/Email.ts`
- Include GST in the billing section of customer/admin emails only when present.
- Recommended display:
  ```txt
  Billing Address: ...
  GST Number: ...
  ```

## Test Plan
- Checkout without GST:
  - order succeeds.
  - `billingAddress.gstNumber` is omitted or undefined.
  - UI/email do not show GST.
- Checkout with same billing address + GST:
  - billing form stays hidden.
  - GST is saved under `billingAddress.gstNumber`.
  - admin/customer order details show GST.
- Checkout with separate billing address + GST:
  - separate billing address and GST are saved together.
  - order details show both correctly.
- Invalid GST:
  - form blocks submit only when GST field has a non-empty invalid value.
- Existing orders:
  - old orders without GST still render normally.

## Assumptions
- GST belongs to billing information, not shipping information.
- GST should be stored as an order snapshot, not on the user profile or saved address.
- GST should be visible in order detail views and order emails, but not in the order table list.
