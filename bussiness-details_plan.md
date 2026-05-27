# Admin Invoice Settings Plan

## Summary
Add an **Invoice Details** section to the existing admin settings page so admins can manage all business/seller fields used in invoices. The database fields already exist in `SiteConfig`; this work is mainly wiring them into validation, form defaults, server update logic, and settings page labeling.

## Key Changes

### Admin Settings Form
- Extend the existing settings form schema in `components/admin/settings/site-config-form.tsx` with:
  - `businessName`
  - `businessAddress`
  - `businessGstin`
  - `businessPan`
  - `businessCin`
  - `businessPhone`
  - `businessEmail`
  - `invoicePrefix`
- Add these fields to `SiteConfigFormProps.config` and `useForm.defaultValues`.
- Add a new form section titled **Invoice Details** between Tax Settings and Announcement Bar.
- Use inputs/textareas:
  - Business Name: text input
  - Business Address: textarea
  - GSTIN: text input, uppercase
  - PAN: text input, uppercase
  - CIN: text input, uppercase
  - Phone: text input
  - Email: email input
  - Invoice Prefix: text input, default `INV`
- Keep all invoice fields optional except `invoicePrefix`, which should default to `INV` if empty.

### Validation
- Keep admin-friendly validation, not overly strict:
  - GSTIN: optional; if present, validate Indian GSTIN format.
  - PAN: optional; if present, validate PAN format.
  - Email: optional; if present, validate email.
  - Invoice Prefix: trim and uppercase; fallback to `INV`.
- Do not block save if CIN/business address are blank.

### Server Action
- Extend `updateSiteConfig` in `actions/admin/site-config.actions.ts` to accept and persist all invoice fields.
- When creating a default config, include:
  - `invoicePrefix: "INV"`
  - optional business fields as `null`/omitted.
- Keep `requireAdmin()` protection.
- Revalidate admin settings and invoice-dependent paths after save:
  - `/admin/settings`
  - `/checkout`
  - optionally `/admin/orders`

### Settings Page Copy
- Update the settings page card title/description in `app/admin/settings/page.tsx` from only “Shipping Configuration” to something broader like:
  - Title: `Store Configuration`
  - Description: `Manage shipping, tax, invoice, and announcement settings`

## Test Plan
- Open admin settings and verify existing shipping/tax values still load.
- Save only invoice details and confirm the form persists them after refresh.
- Save blank optional invoice fields and confirm no validation errors.
- Enter invalid GSTIN/PAN/email and confirm field-level validation blocks submit.
- Confirm `updateSiteConfig` saves invoice fields without affecting shipping/tax settings.
- Confirm new `SiteConfig` creation still works when no config row exists.

## Assumptions
- The schema migration for invoice fields is already applied.
- These settings are global for the single-vendor store.
- Actual invoice PDF generation will be implemented separately and will read these fields from `SiteConfig`.
