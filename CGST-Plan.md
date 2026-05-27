# CGST/SGST Calculation, Storage, and Display Plan

## Summary
Implement 18% GST split into **CGST 9%** and **SGST 9%** on the post-coupon taxable amount. The server will be authoritative for final totals, Razorpay amount, and database values. Checkout will show the same breakdown before payment, and admin/customer order details plus order emails will display the tax breakdown.

Formula:
```txt
subtotal = sum of cart item prices
discount = coupon discount
taxableAmount = max(subtotal - discount, 0)
cgstAmount = taxableAmount * 0.09
sgstAmount = taxableAmount * 0.09
taxAmount = cgstAmount + sgstAmount
total = taxableAmount + taxAmount + shippingFee
```

Shipping stays separate and is not taxed.

## Key Changes

### Database / Prisma
- Keep the current `Order` schema fields:
  ```prisma
  taxableAmount Float @default(0)
  cgstAmount    Float @default(0)
  sgstAmount    Float @default(0)
  taxAmount     Float @default(0)
  ```
- Use the existing migration if it is not already applied:
  `prisma/migrations/20260527122639_added_gst_amount_in_order/migration.sql`
- Regenerate Prisma client after migration so generated types include the new fields.

### Tax Calculation
- Add a small shared helper, preferably in `utils/order-helpers.ts`, for consistent calculation:
  ```ts
  calculateTaxBreakdown(subtotal: number, discount: number)
  ```
- The helper should round currency values to 2 decimals and return:
  ```ts
  {
    taxableAmount,
    cgstAmount,
    sgstAmount,
    taxAmount,
  }
  ```
- Use this helper in both:
  - checkout UI display calculation
  - `actions/payment/initiate-order.ts`
- Server calculation in `initiateOrder` is the source of truth.

### Checkout + Payment Flow
- Update `components/store/checkout/checkout-form.tsx`.
- In the order summary, show:
  - Subtotal
  - Discount, if applied
  - Taxable Amount
  - CGST 9%
  - SGST 9%
  - Shipping Fee
  - Total
- Update displayed total to include GST.
- Keep coupon behavior unchanged, but calculate GST after coupon discount.
- Update `initiateOrder`:
  - compute tax after discount and before final total
  - save `taxableAmount`, `cgstAmount`, `sgstAmount`, and `taxAmount`
  - calculate final `total` as `taxableAmount + taxAmount + shippingFee`
  - send the tax-inclusive `total` to Razorpay.

### Order Details + Emails
- Update admin order details modal to include:
  - Taxable Amount
  - CGST 9%
  - SGST 9%
  - Total Tax, if useful
  - Final Total
- Update customer order details dialogs in both account order list components with the same breakdown.
- Update email data assembly in:
  - `actions/payment/confirm-order.ts`
  - `app/api/webhooks/razorpay/route.ts`
- Update `templates/Email.ts` so customer/admin emails include the same invoice-style summary:
  - subtotal
  - discount
  - taxable amount
  - CGST
  - SGST
  - shipping
  - total
- Keep old orders compatible by treating missing tax fields as `0`.

## Test Plan
- No coupon:
  - subtotal ₹1000
  - taxable ₹1000
  - CGST ₹90
  - SGST ₹90
  - total = ₹1180 + shipping
- Flat coupon:
  - subtotal ₹1000, discount ₹100
  - taxable ₹900
  - CGST ₹81
  - SGST ₹81
  - total = ₹1062 + shipping
- Percentage coupon with max cap:
  - verify GST is based on final actual discount after cap.
- Razorpay:
  - payment amount must equal tax-inclusive order total.
- Admin/customer order details:
  - new orders show tax rows correctly.
  - old orders with `0` tax still render without breaking.
- Emails:
  - customer and admin emails show the same tax-inclusive invoice-style summary.

## Assumptions
- CGST and SGST are always 9% each.
- GST is applied only on `subtotal - discount`, not on shipping.
- Existing shipping charge/free-shipping behavior stays unchanged.
- “Invoice properly” means order detail views and order emails, not a downloadable PDF invoice.
