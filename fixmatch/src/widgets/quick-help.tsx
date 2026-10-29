import {
  AccessoryWidgetBackground,
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
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  shapes,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { INITIAL_QUICK_HELP } from './initial-props';
import type { QuickHelpProps } from './types';

/**
 * "Hurtig hjælp": describe a problem or jump to a trade. Every widget family is supported:
 * small, medium and large on the home screen (and StandBy), and circular, rectangular and
 * inline on the lock screen.
 *
 * The layout is serialised by the 'widget' directive and runs inside the widget extension,
 * so it may only use its props, the environment and the SwiftUI components and modifiers.
 * The app's Fraunces is not in the extension, so titles use the system serif (New York).
 */
function QuickHelpWidget(props: QuickHelpProps, env: WidgetEnvironment) {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = {
    bg: dark ? '#1A1D18' : '#F7F4ED',
    text: dark ? '#F2EEE5' : '#1C1A17',
    muted: dark ? '#B8B1A4' : '#5E574C',
    brand: dark ? '#8CC5A8' : '#2A6150',
    brandSoft: dark ? '#1D2C24' : '#E2EBE4',
    pine: '#1F4A3A',
    pineTop: '#2A5E4A',
    cream: '#F4EFE4',
    onPineSoft: '#C5D3CA',
    ochre: '#D09A2E',
    open: dark ? '#6FD08F' : '#25733F',
    warning: dark ? '#F0B95B' : '#8F5405',
  };
  const serif = (size: number) => font({ size, weight: 'bold', design: 'serif' });

  // The FixMatch "f." – the letter with the ochre dot on its baseline.
  const glyph = (size: number, color: string, dot: string) => (
    <HStack alignment="lastTextBaseline" spacing={size * 0.04}>
      <Text modifiers={[font({ size, weight: 'black', design: 'serif' }), foregroundStyle(color)]}>f</Text>
      <Ellipse modifiers={[foregroundStyle(dot), frame({ width: size * 0.19, height: size * 0.19 })]} />
    </HStack>
  );

  const mark = (size: number) => (
    <ZStack>
      <RoundedRectangle
        cornerRadius={size * 0.234}
        modifiers={[foregroundStyle(c.pine), frame({ width: size, height: size })]}
      />
      {glyph(size * 0.72, c.cream, c.ochre)}
    </ZStack>
  );

  const wordmark = (size: number) => (
    <HStack alignment="lastTextBaseline" spacing={0}>
      <Text modifiers={[serif(size), foregroundStyle(c.text)]}>fixmatch</Text>
      <Text modifiers={[serif(size), foregroundStyle(c.ochre)]}>.</Text>
    </HStack>
  );

  const header = (
    <HStack spacing={8}>
      {mark(30)}
      <VStack alignment="leading" spacing={0}>
        {wordmark(17)}
        <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.muted), lineLimit(1)]}>{props.place}</Text>
      </VStack>
      <Spacer />
      <Link destination={props.describeUrl}>
        <HStack
          spacing={5}
          modifiers={[padding({ horizontal: 11, vertical: 6 }), background(c.pine, shapes.capsule())]}>
          <Image systemName="wand.and.stars" size={12} color={c.ochre} />
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(c.cream)]}>
            {props.describeShort}
          </Text>
        </HStack>
      </Link>
    </HStack>
  );

  const tradeTile = (index: number, size: number) => {
    const trade = props.trades[index];
    if (!trade) return null;
    return (
      <Link key={trade.id} destination={trade.url}>
        <VStack spacing={5} modifiers={[frame({ maxWidth: 1000 })]}>
          <ZStack>
            <RoundedRectangle
              cornerRadius={size * 0.28}
              modifiers={[foregroundStyle(c.brandSoft), frame({ width: size, height: size })]}
            />
            <Image systemName={trade.symbol as 'drop.fill'} size={size * 0.42} color={c.brand} />
          </ZStack>
          <Text
            modifiers={[
              font({ size: 11, weight: 'medium' }),
              foregroundStyle(c.text),
              lineLimit(1),
              minimumScaleFactor(0.8),
            ]}>
            {trade.label}
          </Text>
        </VStack>
      </Link>
    );
  };

  const family = env.widgetFamily ?? 'systemSmall';

  if (family === 'accessoryInline') {
    return (
      <HStack modifiers={[widgetURL(props.describeUrl)]}>
        <Image systemName="wrench.and.screwdriver.fill" />
        <Text>{`FixMatch · ${props.describe}`}</Text>
      </HStack>
    );
  }

  // Lock screen: iOS tints everything in one colour, so the mark is drawn without its tile.
  if (family === 'accessoryCircular') {
    return (
      <ZStack modifiers={[widgetURL(props.describeUrl)]}>
        <AccessoryWidgetBackground />
        {glyph(30, '#FFFFFF', '#FFFFFF')}
      </ZStack>
    );
  }

  if (family === 'accessoryRectangular') {
    const first = props.saved[0];
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(first ? first.url : props.describeUrl)]}>
        <Text modifiers={[serif(13)]}>fixmatch.</Text>
        <Text modifiers={[font({ textStyle: 'headline' }), lineLimit(1), minimumScaleFactor(0.8)]}>
          {first ? first.name : props.describe}
        </Text>
        <Text modifiers={[font({ textStyle: 'caption' }), lineLimit(1)]}>
          {first ? first.status : props.urgentHint}
        </Text>
      </VStack>
    );
  }

  if (family === 'systemSmall') {
    return (
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[
          containerBackground(
            {
              type: 'linearGradient',
              colors: [c.pineTop, c.pine],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 0, y: 1 },
            },
            'widget',
          ),
          widgetURL(props.describeUrl),
        ]}>
        <HStack>
          {glyph(34, c.cream, c.ochre)}
          <Spacer />
          <Image systemName="wand.and.stars" size={15} color={c.ochre} />
        </HStack>
        <Spacer />
        <Text modifiers={[serif(19), foregroundStyle(c.cream), lineLimit(2), minimumScaleFactor(0.85)]}>
          {props.describe}
        </Text>
        <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.onPineSoft), lineLimit(3)]}>
          {props.describeHint}
        </Text>
      </VStack>
    );
  }

  if (family === 'systemMedium') {
    return (
      <VStack spacing={12} modifiers={[containerBackground(c.bg, 'widget')]}>
        {header}
        <Spacer />
        <HStack spacing={6}>
          {tradeTile(0, 44)}
          {tradeTile(1, 44)}
          {tradeTile(2, 44)}
          {tradeTile(3, 44)}
        </HStack>
      </VStack>
    );
  }

  // systemLarge (and anything new): header, the describe card, all trades and saved businesses.
  const savedRows = props.saved.slice(0, 2);
  return (
    <VStack alignment="leading" spacing={9} modifiers={[containerBackground(c.bg, 'widget')]}>
      {header}
      <Link destination={props.describeUrl}>
        <HStack
          spacing={10}
          modifiers={[
            padding({ all: 10 }),
            frame({ maxWidth: 1000 }),
            background(c.pine, shapes.roundedRectangle({ cornerRadius: 16 })),
          ]}>
          <ZStack>
            <Ellipse modifiers={[foregroundStyle(c.ochre), frame({ width: 34, height: 34 })]} />
            <Image systemName="wand.and.stars" size={15} color={c.pine} />
          </ZStack>
          <VStack alignment="leading" spacing={1}>
            <Text modifiers={[serif(17), foregroundStyle(c.cream)]}>{props.describe}</Text>
            <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.onPineSoft), lineLimit(1)]}>
              {props.describeHint}
            </Text>
          </VStack>
          <Spacer />
          <Image systemName="chevron.right" size={12} color={c.onPineSoft} />
        </HStack>
      </Link>
      <Text modifiers={[serif(15), foregroundStyle(c.text)]}>{props.tradesTitle}</Text>
      <HStack spacing={6}>
        {tradeTile(0, 40)}
        {tradeTile(1, 40)}
        {tradeTile(2, 40)}
        {tradeTile(3, 40)}
      </HStack>
      <HStack spacing={6}>
        {tradeTile(4, 40)}
        {tradeTile(5, 40)}
        {tradeTile(6, 40)}
        {tradeTile(7, 40)}
      </HStack>
      <Divider />
      {savedRows.length > 0 ? (
        <VStack alignment="leading" spacing={6}>
          {savedRows.map((business) => {
            const tone = dark ? business.mark.dark : business.mark.light;
            return (
              <Link key={business.id} destination={business.url}>
                <HStack spacing={10}>
                  <ZStack>
                    <RoundedRectangle
                      cornerRadius={8}
                      modifiers={[foregroundStyle(tone.background), frame({ width: 30, height: 30 })]}
                    />
                    <Text modifiers={[serif(13), foregroundStyle(tone.letters)]}>{business.initials}</Text>
                  </ZStack>
                  <VStack alignment="leading" spacing={0}>
                    <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(c.text), lineLimit(1)]}>
                      {business.name}
                    </Text>
                    <Text
                      modifiers={[
                        font({ textStyle: 'caption' }),
                        foregroundStyle(business.open ? c.open : c.muted),
                        lineLimit(1),
                      ]}>
                      {business.status}
                    </Text>
                  </VStack>
                  <Spacer />
                </HStack>
              </Link>
            );
          })}
        </VStack>
      ) : (
        <Link destination={props.urgentUrl}>
          <HStack spacing={10}>
            <Image systemName="bolt.fill" size={14} color={c.warning} />
            <VStack alignment="leading" spacing={0}>
              <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(c.text)]}>{props.urgent}</Text>
              <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.muted), lineLimit(1)]}>
                {props.urgentHint}
              </Text>
            </VStack>
            <Spacer />
          </HStack>
        </Link>
      )}
    </VStack>
  );
}

export const quickHelpWidget = createWidget<QuickHelpProps>('FixMatchQuickHelp', QuickHelpWidget, INITIAL_QUICK_HELP);
