# LotCheck — Project Context for Claude Code

## What this is

A React Native (Expo) mobile app for pre-purchase used car inspections.
Users walk through a 57-item checklist while standing in a driveway looking at a used car,
flag issues, add notes and photos, and optionally export a PDF report.

## Monetization

- Free: full checklist + summary screen
- $3.99 one-time IAP unlock: PDF export (via RevenueCat)

## Target platforms

iOS and Android via React Native / Expo

## Stack

- React Native + Expo (blank-typescript template)
- TypeScript
- Zustand (state management, with persist middleware)
- expo-print (PDF generation via HTML string)
- expo-sharing, expo-file-system, expo-image-picker
- @react-navigation/native + @react-navigation/native-stack
- RevenueCat (IAP — not yet integrated)
- Supabase (optional cloud backup — not yet integrated)

## Project structure

src/
data/
checklist.json - 57-item static checklist, 5 categories, NEVER stored in DB
hooks/
useChecklist.ts - returns { categories, allItems, itemMap }
navigation/
RootNavigator.tsx - NavigationContainer + Stack navigator
screens/
HomeScreen.tsx - TODO: inspection history list + new inspection CTA
NewInspectionScreen.tsx - TODO: year/make/model entry form
CategoryScreen.tsx - TODO: list of 5 categories with progress indicators
ChecklistScreen.tsx - TODO: per-category checklist items
SummaryScreen.tsx - TODO: verdict + stats + PDF export button
services/
PdfExportService.ts - buildHtml() generates full HTML report string
stores/
inspectionStore.ts - Zustand: inspections[], items{}, CRUD actions
purchaseStore.ts - Zustand: isUnlocked, addPurchase, restorePurchases
types/
index.ts - All TypeScript interfaces and enums
utils/
uuid.ts - generateId()
verdict.ts - computeSummary(), verdictLabel()

## Data model summary

- Inspection: id, year, make, model, askingPrice (optional), status, verdict (optional), createdAt, updatedAt
- InspectionItem: id, inspectionId, templateItemId (ref to checklist.json), checked, flagged, severity (optional), note (optional), photoUris[]
- ChecklistTemplate: static JSON bundled in app — 5 categories, 57 items total
- PurchaseRecord: local IAP receipt record
- UserAccount: optional, only created if user enables cloud backup

## Key design decisions

- Checklist is static JSON — never duplicated into DB. InspectionItems store only user responses.
- Verdict computed client-side by computeSummary() from flagged item severity counts
- walk_away items: frame damage, flood damage, odometer rollback, milky oil, smoke, coolant in oil, CEL, brake pull, salvage title, VIN mismatch
- negotiate items: everything else flagged
- Verdict logic: any walk_away flag = walk_away verdict, any negotiate flag = caution verdict, else = pass
- PDF built as HTML string rendered by expo-print (no native PDF library needed)
- Data is local-first via Zustand persist. Supabase sync is optional, only if user creates account.
- No repair cost estimates (no viable free API exists)

## Visual design

- Clean and minimal, trust-building aesthetic
- Primary brand color: #0F6E56 (teal green)
- Walk away severity: red #E24B4A
- Negotiate severity: amber #EF9F27
- Pass: green #639922
- PDF report: structured and professional, banded rows, LotCheck branding in header

## Navigation stack

Home -> NewInspection -> Category -> Checklist -> Summary

## What has been built

- All TypeScript types (src/types/index.ts)
- uuid utility (src/utils/uuid.ts)
- verdict utility with computeSummary and verdictLabel (src/utils/verdict.ts)
- inspectionStore Zustand store (src/stores/inspectionStore.ts)
- purchaseStore Zustand store (src/stores/purchaseStore.ts)
- useChecklist hook (src/hooks/useChecklist.ts)
- checklist.json with all 57 items (src/data/checklist.json)
- PdfExportService with buildHtml (src/services/PdfExportService.ts)
- RootNavigator (src/navigation/RootNavigator.tsx)
- HomeScreen, NewInspectionScreen, CategoryScreen, ChecklistScreen, SummaryScreen — all complete
- App.tsx wired to RootNavigator
- RevenueCat IAP integrated (react-native-purchases v10)
  - Android production key: goog_qzcEMTyyQXMevSXAHbtUQaLWgkU (in App.tsx)
  - iOS key: placeholder — needs real key once Apple approves developer account
  - purchaseStore uses real RevenueCat calls (fetchAndPurchase, restorePurchases, checkEntitlement)
  - SummaryScreen has purchase flow + "Restore purchase" link
- Google Play: internal testing track live, version code 5 (v1.0.0) submitted

## RevenueCat status (as of 2026-04-27)

- Project: LotCheck (app.revenuecat.com)
- Entitlement: `pdf_export`
- Product: PDF Export, `pdf_export`, Non-consumable, $3.99 USD
- Offering: `default` with `lifetime` package
- Store connection: LotCheck (Play Store) connected — credentials showing "needs attention" (Google Play permissions propagation issue, may resolve on its own)
- Test Store API key: test_PrSaixOPZgXPSSKcyEUYWQGTdwQ
- Production Android key: goog_qzcEMTyyQXMevSXAHbtUQaLWgkU (active in code)
- iOS key: not yet created — waiting on Apple developer account approval

## What's still pending

1. **RevenueCat credentials warning** — Google Play service account permissions may need time to propagate; check dashboard and retry
2. **iOS submission** — waiting on Apple developer account approval; once approved:
   - Add iOS app in RevenueCat dashboard
   - Create `pdf_export` product in App Store Connect
   - Get `appl_` API key and replace placeholder in App.tsx
   - Build and submit iOS binary via EAS
3. **Supabase optional cloud backup** — not yet integrated (optional, post-launch)
4. **Full Play Store listing** — store description, screenshots already in assets/store/, needs to be filled in Play Console for production release

## App.tsx current state

Shows Expo default screen. Needs to be updated to:

import { RootNavigator } from './src/navigation/RootNavigator';
export default function App() {
return <RootNavigator />;
}

## Screen designs

All 5 screens have been fully mocked up. Key details:

HomeScreen: inspection history cards with progress bars and flag badges, plus New button at top
NewInspectionScreen: year/make/model pickers plus optional asking price field, Begin Inspection button
CategoryScreen: 5 category rows showing completion status, flag dot indicators, overall progress bar
ChecklistScreen: item rows with check circle, flag pill showing severity, plus Photo and plus Note actions per item
SummaryScreen: verdict label, 3-stat grid (walk away / negotiate / pass counts), PDF export button locked at $3.99, free share summary link button
