import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { getCategory } from '@/data/categories';
import { useIsDark } from '@/hooks/use-theme';
import { clusterPoints, regionForPoints, type Region } from '@/lib/cluster';
import { formatDistance } from '@/lib/format';

import { ClusterBubble, MapPin, OriginDot } from './map-pin';
import type { BusinessMapProps } from './types';
import { t } from '@/i18n';

/**
 * Apple Maps through MapKit (react-native-maps' default provider on iOS, no
 * API key). Our own business pins are drawn on top of the Apple map, which
 * the Apple Developer Program License Agreement, Attachment 6, allows. The
 * Apple Maps logo and "Legal" link must stay visible, so overlays pass their
 * height in `padding` and the label is moved above them. The web build uses
 * business-map.web.tsx.
 */
export function BusinessMap({
  items,
  origin,
  showsUserLocation,
  selectedId,
  onSelect,
  target,
  onRegionChange,
  padding,
}: BusinessMapProps) {
  const dark = useIsDark();
  const map = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(target);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    map.current?.animateToRegion(target, 450);
  }, [target]);

  const clusters = useMemo(
    () =>
      clusterPoints(items, (s) => s.business.coords, region, {
        keepSeparate: (s) => s.business.id === selectedId,
      }),
    [items, region, selectedId],
  );

  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      initialRegion={target}
      onRegionChangeComplete={(next) => {
        setRegion(next);
        onRegionChange(next);
      }}
      showsUserLocation={showsUserLocation}
      showsPointsOfInterests={false}
      showsCompass={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      userInterfaceStyle={dark ? 'dark' : 'light'}
      mapPadding={{
        top: padding.top,
        bottom: padding.bottom,
        left: 0,
        right: 0,
      }}
      legalLabelInsets={{
        top: 0,
        left: 12,
        bottom: padding.bottom + 6,
        right: 0,
      }}
      accessibilityLabel={t('Kort over virksomheder. Brug listen under kortet for at gennemgå dem')}>
      {clusters.map((cluster) => {
        if (cluster.items.length === 1) {
          const { business, distanceKm } = cluster.items[0];
          const selected = business.id === selectedId;
          return (
            <Marker
              key={business.id}
              identifier={business.id}
              coordinate={{
                latitude: business.coords.lat,
                longitude: business.coords.lon,
              }}
              onPress={() => onSelect(business.id)}
              zIndex={selected ? 10 : 1}
              accessibilityLabel={t('{name}, {name2}, {distance} væk', {
                name: business.name,
                name2: getCategory(business.categories[0])?.name,
                distance: formatDistance(distanceKm),
              })}>
              <MapPin category={business.categories[0]} selected={selected} />
            </Marker>
          );
        }
        return (
          <Marker
            key={cluster.key}
            coordinate={{
              latitude: cluster.coords.lat,
              longitude: cluster.coords.lon,
            }}
            onPress={() => {
              const zoomTo = regionForPoints(
                cluster.items.map((s) => s.business.coords),
                1.8,
              );
              if (zoomTo) map.current?.animateToRegion(zoomTo, 450);
            }}
            zIndex={2}
            accessibilityLabel={t('{count} virksomheder. Zoom ind', { count: cluster.items.length })}>
            <ClusterBubble count={cluster.items.length} />
          </Marker>
        );
      })}
      {showsUserLocation ? null : (
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lon }}
          zIndex={0}
          accessibilityLabel={t('Din valgte placering')}>
          <OriginDot />
        </Marker>
      )}
    </MapView>
  );
}
