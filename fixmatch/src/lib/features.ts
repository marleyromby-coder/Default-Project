/**
 * Trustpilot content may only be shown under a written partner agreement with
 * Trustpilot. Until it is signed, build with EXPO_PUBLIC_FIXMATCH_TRUSTPILOT=off:
 * scores, review filters and the review weight are then hidden everywhere.
 */
export const TRUSTPILOT_ENABLED = process.env.EXPO_PUBLIC_FIXMATCH_TRUSTPILOT !== 'off';
