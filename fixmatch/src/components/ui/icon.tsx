import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import type { CategoryId } from '@/lib/types';

/** One semantic icon name per concept: SF Symbols on iOS, Material Symbols elsewhere. */
const ICONS = {
  search: { ios: 'magnifyingglass', web: 'search' },
  location: { ios: 'location.fill', web: 'near_me' },
  pin: { ios: 'mappin.and.ellipse', web: 'location_on' },
  map: { ios: 'map', web: 'map' },
  heart: { ios: 'heart', web: 'favorite' },
  heartFill: { ios: 'heart.fill', web: 'favorite' },
  phone: { ios: 'phone.fill', web: 'call' },
  globe: { ios: 'safari', web: 'language' },
  world: { ios: 'globe.europe.africa', web: 'public' },
  directions: { ios: 'arrow.triangle.turn.up.right.diamond.fill', web: 'directions' },
  share: { ios: 'square.and.arrow.up', web: 'share' },
  verified: { ios: 'checkmark.seal.fill', web: 'verified' },
  shield: { ios: 'checkmark.shield.fill', web: 'verified_user' },
  clock: { ios: 'clock', web: 'schedule' },
  info: { ios: 'info.circle', web: 'info' },
  close: { ios: 'xmark', web: 'close' },
  chevronRight: { ios: 'chevron.right', web: 'chevron_right' },
  back: { ios: 'chevron.left', web: 'chevron_left' },
  chevronDown: { ios: 'chevron.down', web: 'expand_more' },
  compare: { ios: 'square.split.2x1', web: 'compare_arrows' },
  plus: { ios: 'plus', web: 'add' },
  minus: { ios: 'minus', web: 'remove' },
  wand: { ios: 'wand.and.stars', web: 'auto_fix_high' },
  layers: { ios: 'square.3.layers.3d', web: 'layers' },
  check: { ios: 'checkmark', web: 'check' },
  filter: { ios: 'line.3.horizontal.decrease', web: 'filter_list' },
  sliders: { ios: 'slider.horizontal.3', web: 'tune' },
  bolt: { ios: 'bolt.fill', web: 'bolt' },
  building: { ios: 'building.2', web: 'apartment' },
  people: { ios: 'person.2', web: 'groups' },
  calendar: { ios: 'calendar', web: 'calendar_month' },
  tag: { ios: 'tag', web: 'sell' },
  money: { ios: 'banknote', web: 'payments' },
  doc: { ios: 'doc.text', web: 'description' },
  privacy: { ios: 'hand.raised', web: 'privacy_tip' },
  mail: { ios: 'envelope', web: 'mail' },
  flag: { ios: 'exclamationmark.bubble', web: 'report' },
  trash: { ios: 'trash', web: 'delete' },
  sparkles: { ios: 'sparkles', web: 'auto_awesome' },
  list: { ios: 'list.bullet', web: 'list' },
  external: { ios: 'arrow.up.right', web: 'open_in_new' },
  wrench: { ios: 'wrench.and.screwdriver', web: 'handyman' },
  trophy: { ios: 'trophy', web: 'trophy' },
  refresh: { ios: 'arrow.clockwise', web: 'refresh' },
  crosshair: { ios: 'location', web: 'my_location' },
  help: { ios: 'questionmark.circle', web: 'help' },
  scale: { ios: 'scalemass', web: 'balance' },
  store: { ios: 'storefront', web: 'storefront' },
  star: { ios: 'star.fill', web: 'star' },
  megaphone: { ios: 'megaphone', web: 'campaign' },
  car: { ios: 'car.fill', web: 'directions_car' },
  route: { ios: 'point.topleft.down.to.point.bottomright.curvepath', web: 'route' },
  chat: { ios: 'text.bubble', web: 'chat' },
  handshake: { ios: 'hand.thumbsup', web: 'handshake' },
  receipt: { ios: 'list.bullet.rectangle', web: 'receipt_long' },
  euro: { ios: 'creditcard', web: 'credit_card' },
  photo: { ios: 'photo', web: 'image' },
  // Trades
  vvs: { ios: 'drop.fill', web: 'plumbing' },
  elektriker: { ios: 'bolt.fill', web: 'electrical_services' },
  toemrer: { ios: 'hammer.fill', web: 'carpenter' },
  murer: { ios: 'square.stack.3d.up.fill', web: 'foundation' },
  mekaniker: { ios: 'car.fill', web: 'car_repair' },
  maler: { ios: 'paintbrush.fill', web: 'format_paint' },
  tagdaekker: { ios: 'house.fill', web: 'roofing' },
  laasesmed: { ios: 'key.fill', web: 'key' },
} as const satisfies Record<
  string,
  {
    ios: NonNullable<Extract<SymbolViewProps['name'], object>['ios']>;
    web: NonNullable<Extract<SymbolViewProps['name'], object>['web']>;
  }
>;

export type IconName = keyof typeof ICONS;

export function categoryIcon(id: CategoryId): IconName {
  return id;
}

interface Props {
  name: IconName;
  size?: number;
  color: ColorValue;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  style?: StyleProp<ViewStyle>;
}

export function Icon({ name, size = 20, color, weight = 'regular', style }: Props) {
  const symbol = ICONS[name];
  return (
    <SymbolView
      name={{ ios: symbol.ios, android: symbol.web, web: symbol.web }}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
