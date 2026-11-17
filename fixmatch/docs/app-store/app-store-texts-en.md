# App Store texts for FixMatch (English)

For every storefront outside Denmark. Paste into App Store Connect → the app → Distribution → *English (U.K.)* and *English (U.S.)*. Character limits are checked.

**Primary language:** choose *English (U.K.)* when you create the app, and add *Danish* as a second localization. Storefronts without a matching language then show English instead of Danish.

**Only list the countries that have real businesses** (Pricing and Availability). At launch that is Denmark only.

## App information

| Field | English (U.K.) | English (U.S.) |
| --- | --- | --- |
| Name | `FixMatch: Find Tradespeople` (27 / 30) | `FixMatch: Find Local Pros` (25 / 30) |
| Subtitle | `Compare prices & reviews` (24 / 30) | `Compare prices & reviews` (24 / 30) |
| Primary category | Lifestyle | Lifestyle |
| Secondary category | Utilities | Utilities |
| Age rating | User-Generated Content: **Yes** (reviews, neighbour groups and photos of finished work, which can all be reported). Advertising: **Yes** once a paid ad can be shown (the `annonce` column), otherwise no. Everything else: no. Use the rating App Store Connect works out | Same |
| Price | Free | Free |

The reviews in the app are FixMatch's own: only users who contacted the business through FixMatch can review it. The app shows no stars or scores from Trustpilot, Google or other sites, so the texts must not promise them either (guidelines 2.3.1 and 5.2.2). See `docs/jura/anmeldelser.md`.

**Keywords** (no spaces after commas; words already in the name or subtitle are not repeated):

U.K. (99 / 100):

```
plumber,electrician,carpenter,builder,bricklayer,mechanic,garage,painter,decorator,roofer,locksmith
```

U.S. (95 / 100):

```
plumber,electrician,carpenter,contractor,mechanic,auto repair,painter,roofer,locksmith,handyman
```

Do not use "Trustpilot" or competitors' names as keywords. Apple rejects other companies' trademarks (guideline 2.3.7).

**Promotional text** (146 / 170, can be changed without a new version):

```
New: describe your problem in your own words, set a budget, and see which local tradespeople fit it – with prices you can compare before you call.
```

## Description

```
Need a plumber, electrician, carpenter, bricklayer or mechanic? FixMatch finds local businesses and compares them on what matters: price, distance and reviews. You save time and money, and you call them directly.

QUOTE CHECK – IS THE PRICE FAIR?
• Type in a quote, even one you got somewhere else, and see whether the price is low, normal or high
• See what the Danish green tradesperson deduction gives back
• Find businesses nearby that charge less for the same job

DESCRIBE YOUR PROBLEM – WE MATCH YOUR BUDGET
• Write in your own words, e.g. "the kitchen sink is blocked", and what you want to spend
• FixMatch finds the right trade and shows who is within your budget – and who is close
• Your description never leaves your phone

ALL TRADESPEOPLE ON ONE MAP
• See where the businesses are, coloured by trade
• Swipe through them on the map and call straight from the card

SEE THE PRICE BEFORE YOU CALL
• Hourly rates and typical prices for common jobs, in your local currency
• Call-out fees and how each business compares with others in the trade
• Guide prices for jobs such as a blocked drain, a car service or a lock-out

COMPARE ON ONE SCREEN
• Pick up to three businesses and see price, distance, reviews, 24/7 service and licences side by side
• The FixMatch score combines price, distance and reviews – and you decide what counts most
• Sort by price, distance or reviews, and filter by open now, 24/7 and licensed

TRANSPARENT BY DESIGN
• Nobody can pay for a better ranking
• We explain exactly how the ranking works, inside the app
• The Verified badge: FixMatch has checked the company number, the owner and the licence
• Registration numbers and licences on each business page, where they apply
• Reviews only from people who contacted the business through FixMatch

CALL DIRECTLY
• Phone, website and directions in one tap
• No middleman and no fees. The business sees your name and number, so it knows who it is talking to

TRADES IN FIXMATCH
Plumbers, electricians, carpenters, bricklayers, mechanics, painters, roofers and locksmiths – with more to come.

YOUR PRIVACY
No ad networks and no tracking. Paid ads are always labelled "Ad" and never change the order. Your location is only used on your phone to work out distances. Your account is stored on servers in the EU, and you can delete it in the app.

Are you a tradesperson or a garage? Sign up for free under More → Sign up your business.
```

For the U.S. version, replace "coloured" with "colored" and "licences" with "licenses". Prices in the U.S. are shown before sales tax, so do not write "incl. VAT".

## What's New (version 1.0)

```
The first version of FixMatch: find, compare and call local tradespeople and mechanics.
```

## Links

| Field | URL |
| --- | --- |
| Support URL | `https://fixmatchh.netlify.app/en/support/` |
| Marketing URL | `https://fixmatchh.netlify.app/en/` |
| Privacy Policy URL | `https://fixmatchh.netlify.app/en/privacy/` |

The pages are built with `npm run website:build` from `docs/jura/privacy-policy.en.md`, `docs/jura/terms.en.md` and `website/` (see README → Hjemmeside).

## Review notes

App Review Information is the same for every language, so there is one set of notes: copy them from `app-store-tekster.md` → "Noter til Apples review-team" (they are in English). In short, they tell the reviewer:

- Sign in with Apple is the only user login, and the whole app can be browsed without an account ("Skip" on the first screen, "Not now" after Sign in with Apple).
- Calling or messaging a business needs a name and phone number, because the business sees who contacted it. That is the core of the service. Neighbour discount needs sign-in too.
- The businesses are in Copenhagen; outside Denmark the app shows Copenhagen. Profile → Location → "København" picks it by hand.
- How to test My business (step 4): tick **Sign-in required** and put the business id in *User name* and its code in *Password* (`[forretnings-id]` and `[kode]` in `app-store-tekster.md`). They are not stored in git.
- How to report reviews and groups, and that FixMatch reviews reports within 24 hours on weekdays.

## Screenshots

Take a second set with the phone set to English and the location set to a city with businesses. Suggested captions:

1. Home – *"Find the right tradesperson"*
2. List of plumbers – *"Compare price, distance and reviews"*
3. Business page – *"See the price before you call"*
4. Compare side by side – *"Pick the best in 10 seconds"*
5. Describe your problem – *"Your problem, your budget"*
6. Map – *"Everyone on one map"*
