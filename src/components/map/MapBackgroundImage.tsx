import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { COC_TEXTURE_ASSETS } from '@/constants/cocTextureAssets';

interface MapBackgroundImageProps {
  style?: StyleProp<ImageStyle>;
}

/** Flat 2D CoC map — not a 3D plane, so no isometric skew or stretch. */
export function MapBackgroundImage({ style }: MapBackgroundImageProps) {
  return (
    <Image
      source={COC_TEXTURE_ASSETS.mapBaseplate}
      style={[StyleSheet.absoluteFillObject, styles.image, style]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
