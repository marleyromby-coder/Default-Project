import {
  AccessoryWidgetBackground,
  Capsule,
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
 */
function QuickHelpWidget(props: QuickHelpProps, env: WidgetEnvironment) {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = {
    bg: dark ? '#151B24' : '#FFFFFF',
    text: dark ? '#F3F5F8' : '#0E1726',
    muted: dark ? '#A9B3C1' : '#556070',
    ink: '#16213A',
    onInkSoft: '#C6CFDF',
    brand: '#F2541B',
    open: dark ? '#4ADE80' : '#15803D',
  };

  // The FixMatch spirit level, drawn with shapes so it stays sharp at every size.
  const level = (width: number) => {
    const s = width / 50;
    return (
      <ZStack>
        <RoundedRectangle
          cornerRadius={2.5 * s}
          modifiers={[foregroundStyle('#4B5E84'), frame({ width: 50 * s, height: 8.5 * s })]}
        />
        <Capsule modifiers={[foregroundStyle(c.brand), frame({ width: 29 * s, height: 23 * s })]} />
        <HStack spacing={0.95 * s}>
          <Capsule modifiers={[foregroundStyle('#FFFFFF'), frame({ width: 2.3 * s, height: 14.8 * s })]} />
          <Ellipse modifiers={[foregroundStyle('#FFFFFF'), frame({ width: 8.6 * s, height: 7.8 * s })]} />
          <Capsule modifiers={[foregroundStyle('#FFFFFF'), frame({ width: 2.3 * s, height: 14.8 * s })]} />
        </HStack>
      </ZStack>
    );
  };

  const mark = (size: number) => (
    <ZStack>
      <RoundedRectangle
        cornerRadius={size * 0.24}
        modifiers={[foregroundStyle(c.ink), frame({ width: size, height: size })]}
      />
      {level(size * 0.76)}
    </ZStack>
  );

  const header = (
    <HStack spacing={8}>
      {mark(28)}
      <VStack alignment="leading" spacing={0}>
        <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(c.text)]}>FixMatch</Text>
        <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.muted), lineLimit(1)]}>{props.place}</Text>
      </VStack>
      <Spacer />
      <Link destination={props.describeUrl}>
        <HStack
          spacing={5}
          modifiers={[padding({ horizontal: 10, vertical: 6 }), background(c.brand, shapes.capsule())]}>
          <Image systemName="wand.and.stars" size={12} color="#FFFFFF" />
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle('#FFFFFF')]}>
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
              modifiers={[foregroundStyle(trade.color), frame({ width: size, height: size })]}
            />
            <Image systemName={trade.symbol as 'drop.fill'} size={size * 0.44} color="#FFFFFF" />
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
        <Image systemName="level.fill" />
        <Text>{`FixMatch · ${props.describe}`}</Text>
      </HStack>
    );
  }

  if (family === 'accessoryCircular') {
    return (
      <ZStack modifiers={[widgetURL(props.describeUrl)]}>
        <AccessoryWidgetBackground />
        <Image systemName="level.fill" size={24} />
      </ZStack>
    );
  }

  if (family === 'accessoryRectangular') {
    const first = props.saved[0];
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(first ? first.url : props.describeUrl)]}>
        <HStack spacing={4}>
          <Image systemName="level.fill" size={11} />
          <Text modifiers={[font({ size: 12, weight: 'semibold' })]}>FixMatch</Text>
        </HStack>
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
              colors: ['#22304F', c.ink],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 0, y: 1 },
            },
            'widget',
          ),
          widgetURL(props.describeUrl),
        ]}>
        <HStack>
          {level(46)}
          <Spacer />
        </HStack>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 17, weight: 'bold' }),
            foregroundStyle('#FFFFFF'),
            lineLimit(2),
            minimumScaleFactor(0.85),
          ]}>
          {props.describe}
        </Text>
        <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.onInkSoft), lineLimit(3)]}>
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
            background(c.ink, shapes.roundedRectangle({ cornerRadius: 16 })),
          ]}>
          <ZStack>
            <Ellipse modifiers={[foregroundStyle(c.brand), frame({ width: 34, height: 34 })]} />
            <Image systemName="wand.and.stars" size={15} color="#FFFFFF" />
          </ZStack>
          <VStack alignment="leading" spacing={1}>
            <Text modifiers={[font({ textStyle: 'headline' }), foregroundStyle('#FFFFFF')]}>{props.describe}</Text>
            <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(c.onInkSoft), lineLimit(1)]}>
              {props.describeHint}
            </Text>
          </VStack>
          <Spacer />
          <Image systemName="chevron.right" size={12} color={c.onInkSoft} />
        </HStack>
      </Link>
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(c.muted)]}>{props.tradesTitle}</Text>
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
          {savedRows.map((business) => (
            <Link key={business.id} destination={business.url}>
              <HStack spacing={10}>
                <ZStack>
                  <RoundedRectangle
                    cornerRadius={8}
                    modifiers={[foregroundStyle(business.color), frame({ width: 30, height: 30 })]}
                  />
                  <Text modifiers={[font({ size: 12, weight: 'bold', design: 'rounded' }), foregroundStyle('#FFFFFF')]}>
                    {business.initials}
                  </Text>
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
          ))}
        </VStack>
      ) : (
        <Link destination={props.urgentUrl}>
          <HStack spacing={10}>
            <Image systemName="bolt.fill" size={14} color="#B54708" />
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
