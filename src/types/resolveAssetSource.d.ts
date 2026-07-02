declare module 'react-native/Libraries/Image/resolveAssetSource' {
  export interface ResolvedAssetSource {
    uri: string;
    width?: number;
    height?: number;
    scale?: number;
  }

  export default function resolveAssetSource(
    source: unknown,
  ): ResolvedAssetSource | null | undefined;
}
