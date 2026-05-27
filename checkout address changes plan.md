# Billing Address Checkout + Order Display Plan

## Summary
Add a checkout option named **“Use the same address as billing address”**, checked by default. When checked, submit the delivery address as both `shippingAddress` and `billingAddress`. When unchecked, show a second billing-address form with the same fields, validate it, submit it separately, and display billing address anywhere order details are shown.

No Prisma migration is needed because `Order.billingAddress Json` already exists.

## Key Changes

### Checkout Form
- Update `components/store/checkout/checkout-form.tsx`.
- Add state:
  - `useSameBillingAddress: boolean`, default `true`.
  - `billingFormData`, shaped like the current delivery form fields.
  - separate billing validation errors, or a nested error shape.
- Keep existing saved-address selection only for delivery address.
- Add a checkbox/switch below the delivery form:
  - label: `Use the same address as billing address`
  - checked by default.
- If unchecked, render a **Billing Address** card using the same inputs as delivery:
  - first name, last name, phone, email, country, address, apartment, city, state, PIN code.
- On submit:
  - validate delivery form always.
  - validate billing form only when `useSameBillingAddress === false`.
  - create:
    ```ts
    const shippingAddress = deliveryAddressDetails;
    const billingAddress = useSameBillingAddress ? deliveryAddressDetails : billingAddressDetails;
    ```
  - pass both into `initiateOrder`.

### Validation / Types
- Update `lib/zod-schema.ts`.
- Reuse the existing address validation for billing instead of duplicating rules.
- Keep `orderDetailsSchema.billingAddress` optional for backward compatibility, but checkout should always send it.
- Add a small shared client-side address schema/helper if needed so delivery and billing use the same validation rules.
- Keep existing persisted order shape unchanged:
  - `shippingAddress: Json`
  - `billingAddress: Json`

### Order Details UI
- Update admin dashboard order details modal in `components/admin/orders/order-details-dialog.tsx`.
- Replace the current “Shipping Address & Payment Info” two-column row with a responsive layout that shows:
  - Shipping Address
  - Billing Address
  - Payment Details
- Use one shared local render helper/component for address blocks to avoid repeating field formatting.
- If an old order has missing `billingAddress`, show shipping address as fallback and optionally label it as same as shipping.

### Customer Order Views
- Update both customer order detail components:
  - `components/store/account/modern-orders-list.tsx`
  - `components/store/account/orders-list.tsx`
- Add a Billing Address block beside or below Shipping Address in each order details dialog.
- Use the same fallback rule:
  - display `billingAddress` when present.
  - fallback to `shippingAddress` for old orders.

### Emails / Notifications
- Update order email formatting in:
  - `actions/payment/confirm-order.ts`
  - `app/api/webhooks/razorpay/route.ts`
- Include a formatted `billingAddress` string in the order details object.
- Update the email templates in `templates/Email.ts` so customer and admin order emails show billing address along with shipping address.
- For backward compatibility, fallback billing to shipping when `order.billingAddress` is missing.

## Optimized Approach
- Do not add database tables or migrations; the JSON snapshot fields already support this.
- Do not save billing address into the user address book unless a separate feature asks for it.
- Reuse one address shape and one formatting helper where practical, instead of maintaining separate shipping/billing formatting logic.
- Keep the checkout submit payload small and compatible with the existing `initiateOrder` action.

## Test Plan
- Checkout default path:
  - checkbox is selected.
  - billing form is hidden.
  - order stores identical `shippingAddress` and `billingAddress`.
- Checkout separate billing path:
  - uncheck checkbox.
  - billing form appears.
  - missing/invalid billing fields block submit.
  - valid billing fields are stored separately.
- Admin dashboard:
  - order details modal shows both shipping and billing addresses.
  - old orders without billing still display usable billing fallback.
- Customer account:
  - order details dialogs show both addresses.
- Payment/email flow:
  - Razorpay success via `confirmOrder` includes billing in emails.
  - Razorpay webhook success includes billing in emails.
- Run:
  - `npm run lint`
  - `npm run build` if the current repo state allows it.

## Assumptions
- “Dashboard” means the admin order details modal, and “all order views” also includes customer account order detail dialogs and order emails.
- Billing address should be stored only as an order snapshot, not as a saved user address.
- Existing orders must remain readable without a data migration by falling back to shipping address.
