import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useTheme } from '@/hooks/use-theme';

import type { BusinessMapProps } from './types';

/** Apple Maps on iOS (no API key needed). The web build uses business-map.web.tsx. */
export function BusinessMap({ items, origin, selectedId, onSelect }: BusinessMapProps) {
  const colors = useTheme();
  const map = useRef<MapView>(null);

  useEffect(() => {
    map.current?.animateToRegion(
      { latitude: origin.lat, longitude: origin.lon, latitudeDelta: 0.18, longitudeDelta: 0.3 },
      400,
    );
  }, [origin.lat, origin.lon]);

  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      initialRegion={{ latitude: origin.lat, longitude: origin.lon, latitudeDelta: 0.18, longitudeDelta: 0.3 }}
      showsUserLocation
      showsPointsOfInterests={false}
      toolbarEnabled={false}
      accessibilityLabel="Kort over virksomheder">
      {items.map(({ business }) => (
        <Marker
          key={business.id}
          identifier={business.id}
          coordinate={{ latitude: business.coords.lat, longitude: business.coords.lon }}
          title={business.name}
          pinColor={business.id === selectedId ? colors.brandStrong : colors.brand}
          onPress={() => onSelect(business.id)}
        />
      ))}
    </MapView>
  );
}
