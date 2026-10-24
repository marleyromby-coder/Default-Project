# App Store texts for FixMatch (English)

For every storefront outside Denmark. Paste into App Store Connect → the app → Distribution → *English (U.K.)* and *English (U.S.)*. Character limits are checked.

**Primary language:** choose *English (U.K.)* when you create the app, and add *Danish* as a second localization. Storefronts without a matching language then show English instead of Danish.

**Only list the countries that have real businesses** (Pricing and Availability). At launch that is Denmark only.

## App information

| Field | English (U.K.) | English (U.S.) |
| --- | --- | --- |
| Name | `FixMatch: Find Tradespeople` (27 / 30) | `FixMatch: Find Local Pros` (25 / 30) |
| Subtitle (Trustpilot on) | `Compare prices & reviews` (24 / 30) | `Compare prices & reviews` (24 / 30) |
| Subtitle (Trustpilot off) | `Compare prices, call direct` (27 / 30) | `Compare prices, call direct` (27 / 30) |
| Primary category | Lifestyle | Lifestyle |
| Secondary category | Utilities | Utilities |
| Age rating | 4+ | 4+ |
| Price | Free | Free |

The *Trustpilot off* subtitle is for builds without a Trustpilot agreement (`EXPO_PUBLIC_FIXMATCH_TRUSTPILOT=off`, the default in `production`), since those builds show no reviews.

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
Need a plumber, electrician, carpenter, bricklayer or mechanic? FixMatch finds local businesses and compares them on what matters: price and distance. You save time and money, and you call them directly.

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
• Pick up to three businesses and see price, distance, 24/7 service and licences side by side
• The FixMatch score combines price and distance – and you decide what counts most
• Sort by price or distance, and filter by open now, 24/7 and licensed

TRANSPARENT BY DESIGN
• Nobody can pay for a better ranking. Ads are always clearly marked
• We explain exactly how the ranking works, inside the app
• Registration numbers and licences on each business page, where they apply

CALL DIRECTLY
• Phone, website and directions in one tap
• No middleman, no login and no fees

TRADES IN FIXMATCH
Plumbers, electricians, carpenters, bricklayers, mechanics, painters, roofers and locksmiths – with more to come.

YOUR PRIVACY
FixMatch has no login and no ad tracking. Your location is only used on your phone to work out distances.

Are you a tradesperson or a garage? Get in touch and get listed for free.
```

With the Trustpilot agreement in place (and `EXPO_PUBLIC_FIXMATCH_TRUSTPILOT=on` in the build), use the *Trustpilot on* subtitle, change "price and distance" to "price, distance and reviews" in the first paragraph and in the FixMatch score bullet, and add this bullet under *TRANSPARENT BY DESIGN*:

```
• TrustScore and number of reviews from Trustpilot for every business
```

For the U.S. version, replace "coloured" with "colored" and "licences" with "licenses". Prices in the U.S. are shown before sales tax, so do not write "incl. VAT".

## What's New (version 1.0)

```
The first version of FixMatch: find, compare and call local tradespeople and mechanics.
```

## Links

Same URLs as the Danish version (see `app-store-tekster.md`). The privacy policy page should have an English version too: `docs/jura/privatlivspolitik.md` can be translated directly, and the app already shows it in English (More → Privacy policy).

## Review notes

Use the notes in `app-store-tekster.md` (they are already in English). They tell the reviewer which city to pick, since Apple often reviews from the U.S.

## Screenshots

Take a second set with the phone set to English and the location set to a city with businesses. Suggested captions:

1. Home – *"Find the right tradesperson"*
2. List of plumbers – *"Compare price and distance"*
3. Business page – *"See the price before you call"*
4. Compare side by side – *"Pick the best in 10 seconds"*
5. Describe your problem – *"Your problem, your budget"*
6. Map – *"Everyone on one map"*
