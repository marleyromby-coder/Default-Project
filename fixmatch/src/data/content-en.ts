import { APP_INFO } from '@/constants/app-info';
import { CLOSE_MARGIN, WORKSHOP_RADIUS_KM } from '@/lib/matcher';
import { DISTANCE_SCALE_KM, NO_REVIEWS_SCORE, REVIEW_PRIOR_COUNT, REVIEW_PRIOR_MEAN } from '@/lib/ranking';

import type { InfoPage } from './content';

/** English info pages. Same slugs and structure as the Danish ones in content.ts. */
export const INFO_PAGES_EN: Record<
  'rangering' | 'anmeldelser' | 'priser' | 'virksomheder' | 'hjaelp' | 'privatliv' | 'vilkaar' | 'om',
  InfoPage
> = {
  rangering: {
    title: 'How we rank',
    intro:
      'The order is set by the FixMatch score, which you can adjust yourself. No business can pay for a better position.',
    sections: [
      {
        heading: 'The three factors',
        bullets: [
          'Price: the business’s hourly rate compared with the other businesses in the same trade and the same country. The cheapest gets the full score, the most expensive none. Prices are never compared across countries or currencies.',
          `Distance: the straight-line distance from your location. The score falls steadily with distance – at ${DISTANCE_SCALE_KM} km it is about a third of the score at 0 km.`,
          `Reviews: the TrustScore on Trustpilot, weighted by the number of reviews. We add ${REVIEW_PRIOR_COUNT} "neutral" reviews of ${REVIEW_PRIOR_MEAN}, so a handful of reviews cannot give an unfairly high or low score. Businesses without a Trustpilot profile count as ${NO_REVIEWS_SCORE}.`,
        ],
      },
      {
        heading: 'Your weighting',
        paragraphs: [
          'Under "Your priorities" you choose how much each factor matters. The weights add up to 100 %, and the score is the weighted average times 100. You can also sort by price, distance or reviews alone.',
        ],
      },
      {
        heading: 'When you describe your problem',
        paragraphs: [
          `Under "Describe your problem" the app works out the trade and the job from your words. Each business’s own price for the job (times the number of m² or pieces) is compared with your budget, and the businesses are split into four groups in this order: "Within budget" and "Could fit", "Close to budget" (at most ${Math.round(CLOSE_MARGIN * 100)} % over), "Price on request" (the business has not given a price for the job) and "Over budget". Within each group the FixMatch score decides. If it is urgent, businesses with a 24-hour service come first.`,
          `We only show businesses that cover your address (within their own service area). Mechanics are shown within ${WORKSHOP_RADIUS_KM} km, because you drive there yourself. Your description stays on your phone and is not sent to FixMatch or the businesses.`,
        ],
      },
      {
        heading: 'Ads',
        paragraphs: [
          'Businesses can buy a featured spot on the home screen. It is always marked "Ad" and shown apart from the results. Payment never affects the FixMatch score or the order of search results.',
        ],
      },
      {
        heading: 'Filters',
        paragraphs: [
          'Filters such as distance, opening hours, 24-hour service and licences hide businesses but do not change their score.',
        ],
      },
    ],
  },
  anmeldelser: {
    title: 'About reviews',
    intro:
      'Reviews in FixMatch come from Trustpilot. We do not write, edit or filter reviews – we show the business’s overall TrustScore and the number of reviews.',
    sections: [
      {
        heading: 'Does FixMatch check the reviews?',
        paragraphs: [
          'No. FixMatch does not check whether reviews come from customers who actually used the business. Trustpilot describes how it detects and removes fake reviews.',
        ],
      },
      {
        heading: 'How old are the numbers?',
        paragraphs: [
          'Each business shows when its TrustScore was last updated. Tap "See reviews on Trustpilot" to read the individual reviews.',
        ],
      },
      {
        heading: 'What is a TrustScore?',
        paragraphs: [
          'The TrustScore is Trustpilot’s overall rating from 1 to 5. Among other things it gives more weight to recent reviews, so it can differ from a simple average of the stars.',
        ],
      },
    ],
    links: [{ label: 'How Trustpilot handles reviews', url: 'https://corporate.trustpilot.com/trust' }],
  },
  priser: {
    title: 'About prices',
    intro:
      'All prices come from the businesses themselves. In Europe they include VAT; in the US they are before sales tax. They are a guide – you agree the final price with the business.',
    sections: [
      {
        heading: 'Hourly rate and examples',
        paragraphs: [
          'The hourly rate is the range the business usually charges. Some also have a fixed call-out fee, shown next to the hourly rate. The example prices are typical prices for common jobs; materials may come on top.',
        ],
      },
      {
        heading: 'Good advice',
        bullets: [
          'Always ask for a written quote or estimate before the work starts.',
          'Agree what happens if the job turns out bigger than expected.',
          'Keep the invoice – it should show the hourly rate, hours and materials.',
        ],
      },
      {
        heading: 'Tax relief on labour',
        bullets: [
          'Denmark: håndværkerfradrag and servicefradrag on labour in your home (skat.dk).',
          'Sweden: ROT and RUT deductions on labour (skatteverket.se).',
          'Germany: part of the labour cost for work in your home reduces your income tax (§ 35a EStG).',
          'UK and US: usually no general relief for home repairs – check with your tax authority.',
        ],
      },
    ],
  },
  virksomheder: {
    title: 'For businesses',
    intro: 'FixMatch only shows businesses that have said yes. Joining is free, and you decide about your details.',
    sections: [
      {
        heading: 'How to join',
        bullets: [
          'We contact you, or you write to us.',
          'You approve your details: contact, prices, opening hours, photos and your Trustpilot profile.',
          'You sign a consent that you can withdraw at any time.',
        ],
      },
      {
        heading: 'Our promise',
        bullets: [
          'Nobody can pay for a better position in the search results.',
          'No fees per customer or per call – customers call you directly.',
          'We correct or remove your details within 2 working days when you ask.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [`Write to ${APP_INFO.email} if you want to join or something needs correcting.`],
      },
    ],
  },
  hjaelp: {
    title: 'If something goes wrong',
    intro:
      'Most jobs go well. If you are unhappy, complain to the business in writing first and give it a chance to put things right.',
    sections: [
      {
        heading: 'Where to complain',
        bullets: [
          'Denmark: forbrug.dk shows which complaints board can take the case (for example Håndværkets Ankenævn or Ankenævnet for biler).',
          'Sweden: Allmänna reklamationsnämnden (arn.se).',
          'Norway: Forbrukerrådet (forbrukerradet.no).',
          'Germany: the Verbraucherzentrale in your state, or the Schlichtungsstelle of the Handwerkskammer.',
          'UK: Citizens Advice (citizensadvice.org.uk).',
          'US: your state attorney general’s consumer office or the contractor licensing board.',
        ],
      },
      {
        heading: 'Errors in FixMatch',
        paragraphs: [
          'Is something wrong or unlawful? Tap "Report an error" at the bottom of the business page, or write to us. We reply within 2 working days.',
        ],
      },
    ],
    links: [{ label: 'Forbrug.dk (Denmark)', url: 'https://forbrug.dk' }],
  },
  privatliv: {
    title: 'Privacy policy',
    intro: `In short: FixMatch has no login and no ad tracking, and does not send your details anywhere. Controller: ${APP_INFO.company}, ${APP_INFO.email}.`,
    sections: [
      {
        heading: 'Your location',
        paragraphs: [
          'If you allow it, the app uses your location while it is open to work out the distance to the businesses. This happens on your phone, and the location is only stored on your phone. You can choose a town instead.',
        ],
      },
      {
        heading: 'The map and "Describe your problem"',
        paragraphs: [
          'The map is Apple Maps. To show it, your iPhone loads map images directly from Apple under Apple’s privacy policy. What you write under "Describe your problem" is processed on your phone only and is not sent to FixMatch or the businesses.',
        ],
      },
      {
        heading: 'Stored on your phone',
        paragraphs: [
          'Your saved businesses, chosen town and priorities are stored on your phone so they are there next time. You can delete it all under More → Reset app data, or by deleting the app.',
        ],
      },
      {
        heading: 'When you contact a business',
        paragraphs: [
          'Calls and websites happen outside FixMatch, and the business’s own privacy policy applies. Photos are loaded from Pexels’ servers, which can therefore see your IP address.',
        ],
      },
      {
        heading: 'Details about businesses',
        paragraphs: [
          'We show details about businesses and their contacts on the basis of the business’s consent. The consent can be withdrawn at any time, and then we remove the details.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          `You can always contact us at ${APP_INFO.email}. In the EU you can also complain to your data protection authority; in Denmark that is Datatilsynet (datatilsynet.dk).`,
        ],
      },
    ],
    links: [{ label: 'Full privacy policy', url: APP_INFO.privacyUrl }],
  },
  vilkaar: {
    title: 'Terms of use',
    intro:
      'FixMatch helps you find and compare businesses. You make the agreement about the work directly with the business – FixMatch is not a party to it.',
    sections: [
      {
        bullets: [
          'The app is free and needs no login.',
          'Prices, opening hours and other details come from the businesses. We work to keep them correct but cannot guarantee it.',
          'TrustScores come from Trustpilot and are updated regularly.',
          'Report errors or unlawful content with "Report an error", and we will look at it as soon as possible.',
          'Danish law applies, without limiting the consumer rights you have where you live.',
        ],
      },
    ],
    links: [{ label: 'Full terms', url: APP_INFO.termsUrl }],
  },
  om: {
    title: 'About FixMatch',
    intro:
      'FixMatch makes it easy to find the right tradesperson or mechanic. We put price, distance and reviews in one place, so you save both time and money.',
    sections: [
      {
        heading: 'Why FixMatch?',
        bullets: [
          'Price ranges from the start – not after three quotes.',
          'Trustpilot score, company number and licences on one page.',
          'Call directly. No middleman, no fees.',
          'You decide what matters most.',
        ],
      },
      {
        heading: 'Photos and data',
        paragraphs: [
          'Photos from Pexels (pexels.com), used under the Pexels licence. Thanks to the photographers.',
          'City names from GeoNames (geonames.org, CC BY 4.0). Coastlines on the web map from Natural Earth (public domain).',
        ],
      },
    ],
    links: [
      { label: 'The Pexels licence', url: 'https://www.pexels.com/license/' },
      { label: 'GeoNames', url: 'https://www.geonames.org' },
      { label: 'FixMatch on the web', url: APP_INFO.website },
    ],
  },
};
