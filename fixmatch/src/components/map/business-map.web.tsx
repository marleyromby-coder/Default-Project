import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type PointerEvent } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { IconButton } from '@/components/ui/button';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { getCategory } from '@/data/categories';
import outline from '@/data/map-outline.json';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { clusterPoints, regionForPoints, type Region } from '@/lib/cluster';
import { formatDistance } from '@/lib/format';
import type { Coords } from '@/lib/types';

import { clusterSize, ClusterBubble, MapPin, OriginDot, PIN_MARGIN, PIN_SELECTED_SIZE, PIN_SIZE } from './map-pin';
import type { BusinessMapProps } from './types';
import { t } from '@/i18n';

const RINGS = (outline as [number, number][][]).map((ring) => {
  const lons = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return {
    ring,
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
});

/**
 * Web stand-in for Apple Maps (MapKit JS would need a key from the Apple
 * Developer account): country outlines from Natural Earth with the same
 * pins and clusters as the app. Drag to pan, use the buttons to zoom.
 */
export function BusinessMap({
  items,
  origin,
  selectedId,
  onSelect,
  target,
  onRegionChange,
  padding,
}: BusinessMapProps) {
  const colors = useTheme();
  const dark = useIsDark();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<Region>(target);
  const [lastTarget, setLastTarget] = useState(target);
  if (target !== lastTarget) {
    setLastTarget(target);
    setView(target);
  }

  const { width, height } = size;
  const innerHeight = Math.max(1, height - padding.top - padding.bottom);
  const cosLat = Math.cos((view.latitude * Math.PI) / 180);
  // Pixels per degree of latitude, keeping the requested region fully visible.
  const scale = width > 0 ? Math.min(width / (view.longitudeDelta * cosLat), innerHeight / view.latitudeDelta) : 1;
  const project = ({ lat, lon }: Coords) => ({
    x: width / 2 + (lon - view.longitude) * scale * cosLat,
    y: padding.top + innerHeight / 2 - (lat - view.latitude) * scale,
  });

  // What is actually on screen, reported like MapKit's onRegionChangeComplete.
  const visible = useMemo<Region>(
    () =>
      width > 0
        ? {
            latitude: view.latitude + (padding.top - padding.bottom) / (2 * scale),
            longitude: view.longitude,
            latitudeDelta: height / scale,
            longitudeDelta: width / (scale * cosLat),
          }
        : view,
    [view, width, height, scale, cosLat, padding.top, padding.bottom],
  );
  useEffect(() => {
    if (width > 0) onRegionChange(visible);
  }, [visible, width, onRegionChange]);

  // Drag to pan. A press that moves less than a few pixels still reaches the pins.
  const [drag, setDrag] = useState<{ x: number; y: number; view: Region; moved: boolean }>();
  const panHandlers = {
    onPointerDown: (e: PointerEvent) =>
      setDrag({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, view, moved: false }),
    onPointerMove: (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.nativeEvent.clientX - drag.x;
      const dy = e.nativeEvent.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!drag.moved) setDrag({ ...drag, moved: true });
      setView({
        ...drag.view,
        longitude: drag.view.longitude - dx / (scale * cosLat),
        latitude: drag.view.latitude + dy / scale,
      });
    },
    onPointerUp: () => setDrag(undefined),
    onPointerLeave: () => setDrag(undefined),
  };

  const zoom = (factor: number) =>
    setView((v) => ({
      ...v,
      latitudeDelta: v.latitudeDelta * factor,
      longitudeDelta: v.longitudeDelta * factor,
    }));

  const clusters = useMemo(
    () =>
      clusterPoints(items, (s) => s.business.coords, visible, {
        keepSeparate: (s) => s.business.id === selectedId,
      }),
    [items, visible, selectedId],
  );

  const paths = useMemo(() => {
    if (width === 0) return '';
    // Only the countries that are on screen.
    const lonSpan = visible.longitudeDelta / 2 + 1;
    const latSpan = visible.latitudeDelta / 2 + 1;
    return RINGS.filter(
      (r) =>
        r.maxLon >= visible.longitude - lonSpan &&
        r.minLon <= visible.longitude + lonSpan &&
        r.maxLat >= visible.latitude - latSpan &&
        r.minLat <= visible.latitude + latSpan,
    )
      .map(
        ({ ring }) =>
          ring
            .map(([lon, lat], i) => {
              const p = project({ lat, lon });
              // A jump across the date line starts a new segment instead of a line across the map.
              const jump = i > 0 && Math.abs(lon - ring[i - 1][0]) > 180;
              return `${i === 0 || jump ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join('') + 'Z',
      )
      .join('');
    // project depends on these values only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, view, visible, scale, cosLat, padding.top, padding.bottom]);

  const water = dark ? '#0F1B27' : '#CFE2F0';
  const land = dark ? '#1F2835' : '#F3F0E8';
  const coast = dark ? '#2D3A4B' : '#D7D1C2';
  const originPoint = project(origin);

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: water }]}
      onLayout={(e) =>
        setSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
      {...panHandlers}>
      {width > 0 ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Rect x={0} y={0} width={width} height={height} fill={water} />
          <Path d={paths} fill={land} stroke={coast} strokeWidth={1} />
        </Svg>
      ) : null}

      <View pointerEvents="none" style={[styles.marker, { left: originPoint.x - 12, top: originPoint.y - 12 }]}>
        <OriginDot />
      </View>

      {width > 0
        ? clusters.map((cluster) => {
            const p = project(cluster.coords);
            if (p.x < -40 || p.y < -40 || p.x > width + 40 || p.y > height + 40) return null;
            if (cluster.items.length === 1) {
              const { business, distanceKm } = cluster.items[0];
              const selected = business.id === selectedId;
              const half = (selected ? PIN_SELECTED_SIZE : PIN_SIZE) / 2 + PIN_MARGIN;
              return (
                <Tappable
                  key={business.id}
                  onPress={() => onSelect(business.id)}
                  accessibilityLabel={t('{name}, {name2}, {distance} væk', {
                    name: business.name,
                    name2: getCategory(business.categories[0])?.name,
                    distance: formatDistance(distanceKm),
                  })}
                  style={[
                    styles.marker,
                    {
                      left: p.x - half,
                      top: p.y - half,
                      zIndex: selected ? 10 : 1,
                    },
                  ]}>
                  <MapPin category={business.categories[0]} selected={selected} />
                </Tappable>
              );
            }
            const half = clusterSize(cluster.items.length) / 2 + PIN_MARGIN;
            return (
              <Tappable
                key={cluster.key}
                onPress={() => {
                  const next = regionForPoints(
                    cluster.items.map((s) => s.business.coords),
                    1.8,
                  );
                  if (next) setView(next);
                }}
                accessibilityLabel={t('{count} virksomheder. Zoom ind', { count: cluster.items.length })}
                style={[styles.marker, { left: p.x - half, top: p.y - half, zIndex: 2 }]}>
                <ClusterBubble count={cluster.items.length} />
              </Tappable>
            );
          })
        : null}

      <View style={[styles.zoom, { bottom: padding.bottom + 8 }]}>
        <IconButton
          icon="plus"
          onPress={() => zoom(0.5)}
          accessibilityLabel={t('Zoom ind')}
          background={colors.surface}
        />
        <IconButton
          icon="minus"
          onPress={() => zoom(2)}
          accessibilityLabel={t('Zoom ud')}
          background={colors.surface}
        />
      </View>
      <View style={[styles.credit, { bottom: padding.bottom + 8 }]} pointerEvents="none">
        <AppText variant="caption2" tone="textSecondary">
          {t('Kystlinje: Natural Earth')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: { position: 'absolute' },
  zoom: { position: 'absolute', right: 12, gap: 8 },
  credit: { position: 'absolute', left: 12 },
});
