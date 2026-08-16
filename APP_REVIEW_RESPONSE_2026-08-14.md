# Response to App Review — Guideline 2.1

App: **¿Qué te falta?**  
Apple ID: **6800699896**  
Version: **1.0**

The main text is deliberately kept below App Store Connect’s 4,000-character Notes limit.

## App Review Notes

Hello App Review Team,

Thank you for your feedback regarding Guideline 2.1. Here is the requested information.

1. **Recording:** Attached: **WhatsApp Video 2026-08-14 at 11.24.05.mp4**, captured on a physical **iPhone 17 Pro** running **iOS 26.6**. It starts from the iPhone Home Screen, launches the app, and shows text/voice item entry, microphone and speech-recognition permissions, duplicate/quantity handling, shopping mode and purchase completion, expiration tracking and notification permission, a special list, the iOS share sheet, and the optional account entry points. There are no paid features or IAPs. Shared lists are private and invitation-only; there is no public UGC feed, profile discovery, reporting, or blocking flow.

2. **Tested device:** **iPhone 17 Pro — iOS 26.6**, physical device, complete core-flow test. Separately, 29/29 automated functional tests pass for parsing, duplicates, categories, expiration rules, sharing links, encryption, authenticated sharing, account-provider handling, and Firebase sync.

3. **Purpose and audience:** This is a free household shopping-list app for individuals, couples, and families. It coordinates purchases, groups products by category, prevents accidental duplicates, and helps reduce food waste. It supports text/voice entry, spoken list readout, quantities, shopping check-off/history, independent special lists, expiration reminders three days and one day before expiry, and optional private sharing. Registration is not required for local use. There is no advertising, analytics, tracking, or paid content.

4. **Access:** No account, subscription, purchase, or sample file is required for local features. Add items in the main field or microphone; add an existing item for the duplicate prompt; tap “Voy a comprar” for shopping mode; use “Caducidad” to add a product/date and allow notifications; and use “Nueva lista” for a special list. Sharing requires authentication: open Settings, choose Sign in with Apple, then tap “Compartir con la familia”. Each invitation grants access only to the selected list. The account and its data can be deleted inside Settings.

5. **External services:** Firebase Authentication and Firebase Realtime Database (European region) are used only for optional account access and private shared-list synchronization. New shared lists require an authenticated Google or Apple account and are accessible only to invited members. Legacy password shares remain AES-256-GCM encrypted during migration and no new legacy shares are created. Apple iOS APIs provide microphone, speech recognition, local notifications, Sign in with Apple, and the share sheet. GitHub Pages hosts privacy/support pages and the web companion. Capacitor provides the native bridge. No AI, ads, analytics, or payments are used.

6. **Regions:** Functionality is the same in all regions. The UI/store metadata are currently Spanish (Spain). There are no regional feature locks, payments, or region-dependent accounts.

7. **Regulated/protected content:** The app is not in a regulated industry and contains no protected third-party material. Users enter only their own private shopping-list data; no licenses or regulatory documents apply.

Thank you for reviewing the app.

## Short reply in the App Review conversation

Hello App Review Team,

Thank you for clarifying the information required under Guideline 2.1. We have added all requested details to App Review Notes and attached a screen recording captured on a physical **iPhone 17 Pro** running **iOS 26.6**, beginning with app launch and covering the core flow and relevant permissions. No account or paid access is required.

The requested information and recording are now available for your review. Thank you.
