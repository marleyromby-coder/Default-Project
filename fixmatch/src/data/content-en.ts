import { APP_INFO } from '@/constants/app-info';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { CLOSE_MARGIN, WORKSHOP_RADIUS_KM } from '@/lib/matcher';
import { MIN_PAID_PRICES } from '@/lib/prices';
import { DISTANCE_SCALE_KM, NO_REVIEWS_SCORE, REVIEW_PRIOR_COUNT, REVIEW_PRIOR_MEAN } from '@/lib/ranking';
import { TOP_RATED_MIN_REVIEWS, TOP_RATED_MIN_SCORE, VERIFICATION_VALID_DAYS } from '@/lib/verification';

import type { InfoPage } from './content';

/** English info pages. Same slugs and structure as the Danish ones in content.ts. */
export function infoPagesEn(
  reviews = TRUSTPILOT_ENABLED,
): Record<
  'rangering' | 'anmeldelser' | 'priser' | 'virksomheder' | 'verificering' | 'hjaelp' | 'privatliv' | 'vilkaar' | 'om',
  InfoPage
> {
  return {
    rangering: {
      title: 'How we rank',
      intro:
        'The order is set by the FixMatch score, which you can adjust yourself. No business can pay for a better position.',
      sections: [
        {
          heading: reviews ? 'The three factors' : 'The two factors',
          bullets: [
            'Price: the business’s hourly rate compared with the other businesses in the same trade and the same country. The cheapest gets the full score, the most expensive none. Prices are never compared across countries or currencies.',
            `Distance: the straight-line distance from your location. The score falls steadily with distance – at ${DISTANCE_SCALE_KM} km it is about a third of the score at 0 km.`,
            ...(reviews
              ? [
                  `Reviews: the TrustScore on Trustpilot, weighted by the number of reviews. We add ${REVIEW_PRIOR_COUNT} "neutral" reviews of ${REVIEW_PRIOR_MEAN}, so a handful of reviews cannot give an unfairly high or low score. Businesses without a Trustpilot profile count as ${NO_REVIEWS_SCORE}.`,
                ]
              : []),
          ],
        },
        {
          heading: 'Your weighting',
          paragraphs: [
            `Under "Your priorities" you choose how much each factor matters. The weights add up to 100 %, and the score is the weighted average times 100. You can also sort by ${reviews ? 'price, distance or reviews' : 'price or distance'} alone.`,
          ],
        },
        {
          heading: 'When you describe your problem',
          paragraphs: [
            `Under "Describe your problem" the app works out the trade and the job from your words. Each business’s own price for the job (times the number of m² or pieces) is compared with your budget, and the businesses are split into four groups in this order: "Within budget" and "Could fit", "Close to budget" (at most ${Math.round(CLOSE_MARGIN * 100)} % over), "Price on request" (the business has not given a price for the job) and "Over budget". Within each group the FixMatch score decides. If it is urgent, businesses with a 24-hour service come first, then those that have marked free time today.`,
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
            'Filters such as distance, opening hours, 24-hour service, licences and Verified hide businesses but do not change their score. The Verified badge and reviews written in FixMatch do not give a better position either.',
          ],
        },
      ],
    },
    anmeldelser: {
      title: 'About reviews',
      intro:
        'The reviews under "Customer experiences" only come from customers who contacted the business through FixMatch. Nobody can buy, write or remove reviews for a business.',
      sections: [
        {
          heading: 'Who can write a review?',
          paragraphs: [
            'Only users who called or wrote to the business through FixMatch. Each user can review a business once and can change the review later. Others only see your initial, never your name.',
          ],
        },
        {
          heading: 'Does FixMatch check the reviews?',
          paragraphs: [
            'Yes, in part. We check that you contacted the business through FixMatch before you can review it. We cannot see whether the job was done or what you agreed. We show all reviews, the bad ones too, newest first, and we never change the text.',
          ],
        },
        {
          heading: 'When do we hide a review?',
          bullets: [
            'It contains names, phone numbers or other personal data.',
            'It is offensive or threatening, or it is not about the business.',
            'It was written by the business itself, its staff or a competitor.',
          ],
          paragraphs: [
            `If you think a review breaks the rules, tap "Report" next to it or write to ${APP_INFO.email}. The business cannot remove reviews itself.`,
          ],
        },
        {
          heading: 'Do reviews affect the order?',
          paragraphs: [
            reviews
              ? 'No. Reviews written in FixMatch do not affect the FixMatch score or the order. The score only uses the TrustScore from Trustpilot (see "How we rank").'
              : 'No. Reviews written in FixMatch do not affect the FixMatch score or the order. They are on the business’s page so you can read them yourself.',
          ],
        },
        ...(reviews
          ? [
              {
                heading: 'Reviews from Trustpilot',
                paragraphs: [
                  'The TrustScore comes from Trustpilot. We show the overall TrustScore and the number of reviews, but we do not write, edit or filter them. FixMatch does not check whether Trustpilot reviews come from real customers; Trustpilot describes how it detects and removes fake reviews.',
                  'Each business shows when its TrustScore was last updated. The TrustScore is Trustpilot’s overall rating from 1 to 5 and gives more weight to recent reviews, so it can differ from a simple average.',
                ],
              },
            ]
          : []),
      ],
      links: reviews
        ? [{ label: 'How Trustpilot handles reviews', url: 'https://corporate.trustpilot.com/trust' }]
        : [],
    },
    priser: {
      title: 'About prices',
      intro:
        'Hourly rates and example prices come from the businesses themselves. "What customers paid" comes from customers. All prices include VAT and are a guide – you agree the final price with the business.',
      sections: [
        {
          heading: 'Hourly rate and examples',
          paragraphs: [
            'The hourly rate is the range the business usually charges. Some also have a fixed call-out fee, shown next to the hourly rate. The example prices are typical prices for common jobs; materials may come on top.',
          ],
        },
        {
          heading: 'What customers paid',
          paragraphs: [
            `If you contacted a business through FixMatch, you can share what the job cost. Once at least ${MIN_PAID_PRICES} people have shared a price for the same job, we show the range of the middle 60 % – we leave out the cheapest 20 % and the most expensive 20 %, so a few extreme prices do not skew it. We use prices from the last 24 months, and Quote check compares with them too.`,
            'We never show who shared a price, and only the first two digits of the postcode.',
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
            'UK: usually no general relief for home repairs – check with HMRC.',
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
            'Sign up under More → Sign up your business or on the website. It takes a few minutes.',
            reviews
              ? 'You approve your details: contact, prices, opening hours, photos and your Trustpilot profile.'
              : 'You approve your details: contact, prices, opening hours and photos.',
            'You give your consent when you sign up and can withdraw it at any time.',
            'If you want the Verified badge, tick it when you sign up in the app or on the website. It is free.',
            'When a customer calls you through FixMatch, you can see the customer’s name and phone number.',
            `If you have time today or tomorrow, tap "Free today" on your personal link (${APP_INFO.website}/en/available/). You then appear under "Who has time today?", and customers with something urgent see you first. It disappears by itself at midnight. We send you the link.`,
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
    verificering: {
      title: 'How we verify',
      intro:
        'Verified means FixMatch has checked who the business is – a bit like a blue tick, but for tradespeople. It is free, the criteria are the same for everyone, and the badge does not give a better position.',
      sections: [
        {
          heading: 'What we check',
          bullets: [
            'Company number: that the CVR number is active in the Danish business register and belongs to the business.',
            'The owner: that the person who signed the business up owns it or may act on its behalf.',
            'Licence: for electrical, plumbing and drainage work we look the licence up with the Danish Safety Technology Authority. Without it, there is no badge.',
            'Insurance and guarantee scheme: when they are listed on the business’s page, it has shown us the policy or the membership.',
          ],
        },
        {
          heading: 'How long does it last?',
          paragraphs: [
            `The badge lasts ${VERIFICATION_VALID_DAYS} days from the day we checked. Then we check again. The business’s page shows the date and everything we checked.`,
          ],
        },
        ...(reviews
          ? [
              {
                heading: 'Top rated',
                paragraphs: [
                  `Verified businesses with a TrustScore of at least ${TOP_RATED_MIN_SCORE} and at least ${TOP_RATED_MIN_REVIEWS} reviews on Trustpilot are Top rated.`,
                ],
              },
            ]
          : []),
        {
          heading: 'What the badge does not mean',
          paragraphs: [
            'Verified is not a guarantee of the quality of the work. Still ask for a written quote, and check the price with Quote check.',
          ],
        },
        {
          heading: 'Are you a business?',
          paragraphs: [
            `Tick "Yes, verify us" when you sign up your business in the app (More → Sign up your business) or on the website, or write to ${APP_INFO.email}. It is free.`,
          ],
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
          ],
        },
        {
          heading: 'Errors in FixMatch',
          paragraphs: [
            'Is something wrong or unlawful? Tap "Report an error or unlawful content" at the bottom of the business page, or write to us. We reply within 2 working days.',
          ],
        },
      ],
      links: [{ label: 'Forbrug.dk (Denmark)', url: 'https://forbrug.dk' }],
    },
    privatliv: {
      title: 'Privacy policy',
      intro: `In short: FixMatch has no ads and no tracking. If you create an account, we store your name, phone number and e-mail in the EU, so the businesses you call know who they are talking to. Everything else stays on your phone. Controller: ${APP_INFO.company}, ${APP_INFO.email}.`,
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
            'Pictures of the problem stay on your phone and are forgotten when the app closes. If you send them to a business, it happens as a message from your own phone. FixMatch never receives them.',
          ],
        },
        {
          heading: 'Stored on your phone',
          paragraphs: [
            'Your saved businesses, chosen town, priorities and the list of businesses you have contacted (under Profile) are stored on your phone so they are there next time. You can delete it all under More → Reset app data, or by deleting the app.',
          ],
        },
        {
          heading: 'Your account',
          paragraphs: [
            'You can browse and compare without an account. The first time you call a business, we ask you to create one. We store your e-mail (or your Apple ID), your name, your phone number and which businesses you have called and when – with Supabase on servers in the EU (Frankfurt).',
            'Only the business you call sees your name and number. We never sell them. You delete it all under Profile → Delete account.',
          ],
        },
        {
          heading: 'Reviews and prices you share',
          paragraphs: [
            'If you review a business or share what you paid, we store it with your account at Supabase in the EU, so we can check that you contacted the business. Others only see your initial on reviews, and prices are only shown together once at least 3 people have shared. It is deleted when you delete your account.',
          ],
        },
        {
          heading: 'When you contact a business',
          paragraphs: [
            'The call itself and websites happen outside FixMatch, and the business’s own privacy policy applies. If a business has its own picture on FixMatch, it is loaded from the internet, and that server can see your IP address.',
          ],
        },
        {
          heading: 'Details about businesses',
          paragraphs: [
            'We show details about businesses and their contacts on the basis of the business’s consent. The consent can be withdrawn at any time, and then we remove the details.',
            'If a business asks for the Verified badge, we also keep its licence number, insurance and guarantee scheme, and what we checked and when, for as long as the badge lasts.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            `You can always contact us at ${APP_INFO.email}. In the EU you can also complain to your data protection authority; in Denmark that is Datatilsynet (datatilsynet.dk).`,
          ],
        },
      ],
      links: [{ label: 'Full privacy policy', url: APP_INFO.privacyUrlEn }],
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
            ...(reviews ? ['TrustScores come from Trustpilot and are updated regularly.'] : []),
            'Report errors or unlawful content at the bottom of the business page, and we will look at it as soon as possible.',
            'Danish law applies, without limiting the consumer rights you have where you live.',
          ],
        },
      ],
      links: [{ label: 'Full terms', url: APP_INFO.termsUrlEn }],
    },
    om: {
      title: 'About FixMatch',
      intro: `FixMatch makes it easy to find the right tradesperson or mechanic. We put ${reviews ? 'price, distance and reviews' : 'price, distance and licences'} in one place, so you save both time and money.`,
      sections: [
        {
          heading: 'Why FixMatch?',
          bullets: [
            'Price ranges from the start – not after three quotes.',
            'Quote check tells you whether a quote you got is low, normal or high.',
            'The Verified badge shows which businesses FixMatch has checked itself.',
            reviews
              ? 'Trustpilot score, company number and licences on one page.'
              : 'Company number and licences on one page.',
            'Call directly. No middleman, no fees.',
            'You decide what matters most.',
          ],
        },
        {
          heading: 'Data and typeface',
          paragraphs: [
            'City names from GeoNames (geonames.org, CC BY 4.0). Coastlines on the web map from Natural Earth (public domain).',
            'Headings are set in Fraunces by Undercase Type (SIL Open Font License 1.1).',
          ],
        },
      ],
      links: [
        { label: 'GeoNames', url: 'https://www.geonames.org' },
        { label: 'FixMatch on the web', url: APP_INFO.website },
      ],
    },
  };
}
