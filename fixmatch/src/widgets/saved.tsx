import {
  Divider,
  Ellipse,
  HStack,
  Image,
  Link,
  RoundedRectangle,
  Spacer,
  Text,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  multilineTextAlignment,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { INITIAL_SAVED } from './initial-props';
import type { SavedProps } from './types';

/**
 * "Gemte håndværkere": the businesses the user saved, with whether they are open right now.
 * The app sends a timeline, so "Åben til 16.00" turns into "Lukket" without opening the app.
 * Supports small, medium and large on the home screen, and rectangular and inline on the
 * lock screen.
 */
function SavedWidget(props: SavedProps, env: WidgetEnvironment) {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = {
    bg: dark ? '#1A1D18' : '#F7F4ED',
    text: dark ? '#F2EEE5' : '#1C1A17',
    muted: dark ? '#B8B1A4' : '#5E574C',
    brand: dark ? '#8CC5A8' : '#2A6150',
    open: dark ? '#6FD08F' : '#25733F',
  };
  const family = env.widgetFamily ?? 'systemSmall';
  const first = props.saved[0];

  // The business's initials on a tint of its trade colour, like the marks in the app.
  const markOf = (business: SavedProps['saved'][number], size: number) => {
    const tone = dark ? business.mark.dark : business.mark.light;
    return (
      <ZStack>
        <RoundedRectangle
          cornerRadius={size * 0.26}
          modifiers={[foregroundStyle(tone.background), frame({ width: size, height: size })]}
        />
        <Text modifiers={[font({ size: size * 0.42, weight: 'bold', design: 'serif' }), foregroundStyle(tone.letters)]}>
          {business.initials}
        </Text>
      </ZStack>
    );
  };

  const status = (business: SavedProps['saved'][number]) => (
    <HStack spacing={5}>
      <Ellipse modifiers={[foregroundStyle(business.open ? c.open : c.muted), frame({ width: 7, height: 7 })]} />
      <Text
        modifiers={[
          font({ textStyle: 'caption' }),
          foregroundStyle(business.open ? c.open : c.muted),
          lineLimit(1),
          minimumScaleFactor(0.85),
        ]}>
        {business.status}
      </Text>
    </HStack>
  );

  if (family === 'accessoryInline') {
    return (
      <HStack modifiers={[widgetURL(first ? first.url : props.appUrl)]}>
        <Image systemName="heart.fill" />
        <Text>{first ? `${first.name} · ${first.status}` : props.empty}</Text>
      </HStack>
    );
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(first ? first.url : props.appUrl)]}>
        <HStack spacing={4}>
          <Image systemName="heart.fill" size={11} />
          <Text modifiers={[font({ size: 12, weight: 'semibold' }), lineLimit(1)]}>{props.title}</Text>
        </HStack>
        {props.saved.slice(0, 2).map((business) => (
          <Text key={business.id} modifiers={[font({ textStyle: 'caption' }), lineLimit(1)]}>
            {`${business.name} · ${business.status}`}
          </Text>
        ))}
        {first ? null : <Text modifiers={[font({ textStyle: 'caption' }), lineLimit(2)]}>{props.emptyHint}</Text>}
      </VStack>
    );
  }

  if (!first) {
    return (
      <VStack spacing={6} modifiers={[containerBackground(c.bg, 'widget'), widgetURL(props.appUrl)]}>
        <Spacer />
        <Image systemName="heart.fill" size={26} color={c.brand} />
        <Text
          modifiers={[
            font({ size: 17, weight: 'bold', design: 'serif' }),
            foregroundStyle(c.text),
            multilineTextAlignment('center'),
          ]}>
          {props.empty}
        </Text>
        <Text
          modifiers={[
            font({ textStyle: 'caption' }),
            foregroundStyle(c.muted),
            multilineTextAlignment('center'),
            lineLimit(3),
          ]}>
          {props.emptyHint}
        </Text>
        <Spacer />
      </VStack>
    );
  }

  if (family === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[containerBackground(c.bg, 'widget'), widgetURL(first.url)]}>
        <HStack>
          {markOf(first, 40)}
          <Spacer />
          <Image systemName="heart.fill" size={14} color={c.brand} />
        </HStack>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 17, weight: 'bold', design: 'serif' }),
            foregroundStyle(c.text),
            lineLimit(2),
            minimumScaleFactor(0.85),
          ]}>
          {first.name}
        </Text>
        {status(first)}
        <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.muted), lineLimit(1)]}>{first.price}</Text>
      </VStack>
    );
  }

  const rows = props.saved.slice(0, family === 'systemLarge' ? 6 : 3);
  return (
    <VStack
      alignment="leading"
      spacing={family === 'systemLarge' ? 10 : 7}
      modifiers={[containerBackground(c.bg, 'widget')]}>
      <HStack spacing={6}>
        <Image systemName="heart.fill" size={13} color={c.brand} />
        <Text modifiers={[font({ size: 15, weight: 'bold', design: 'serif' }), foregroundStyle(c.text)]}>
          {props.title}
        </Text>
        <Spacer />
        {props.openSummary ? (
          <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.open)]}>{props.openSummary}</Text>
        ) : null}
      </HStack>
      {rows.map((business, index) => (
        <VStack key={business.id} alignment="leading" spacing={family === 'systemLarge' ? 10 : 7}>
          {index > 0 && family === 'systemLarge' ? <Divider /> : null}
          <Link destination={business.url}>
            <HStack spacing={10}>
              {markOf(business, family === 'systemLarge' ? 36 : 30)}
              <VStack alignment="leading" spacing={1}>
                <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(c.text), lineLimit(1)]}>
                  {business.name}
                </Text>
                {status(business)}
              </VStack>
              <Spacer />
              <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.muted), lineLimit(1)]}>
                {business.price}
              </Text>
            </HStack>
          </Link>
        </VStack>
      ))}
      <Spacer />
    </VStack>
  );
}

export const savedWidget = createWidget<SavedProps>('FixMatchSaved', SavedWidget, INITIAL_SAVED);
