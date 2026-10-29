/**
 * Trustpilot content may only be shown under a written partner agreement with
 * Trustpilot. Until it is signed it is off in every build – EAS, Xcode, Expo Go and
 * the web demo – and scores, review filters and the review weight are hidden
 * everywhere. Build with EXPO_PUBLIC_FIXMATCH_TRUSTPILOT=on to show it.
 */
export const TRUSTPILOT_ENABLED = process.env.EXPO_PUBLIC_FIXMATCH_TRUSTPILOT === 'on';
