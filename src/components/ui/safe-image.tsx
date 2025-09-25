import NextImage, { type ImageProps as NextImageProps } from "next/image";
import type { CSSProperties, ReactNode, SyntheticEvent } from "react";
import { useState } from "react";

import {
  isBlobUrl,
  isDataUrl,
  sanitizeRemoteImageSrc,
} from "@/utils/safe-image";

type SafeImageProps = Omit<NextImageProps, "src"> & {
  src: NextImageProps["src"] | null | undefined;
  fallback?: ReactNode;
};

export function SafeImage({
  src,
  fallback = null,
  onLoadingComplete,
  ...nextImageProps
}: SafeImageProps) {
  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  if (typeof src === "string") {
    const trimmed = src.trim();
    if (!trimmed) {
      return fallback ? <>{fallback}</> : null;
    }

    if (isBlobUrl(trimmed) || isDataUrl(trimmed)) {
      return (
        <NativeImage
          src={trimmed}
          fallback={fallback}
          onLoadingComplete={onLoadingComplete}
          {...nextImageProps}
        />
      );
    }

    const sanitized = sanitizeRemoteImageSrc(trimmed);
    if (!sanitized) {
      return fallback ? <>{fallback}</> : null;
    }

    return (
      <NextImage
        {...nextImageProps}
        src={sanitized}
        onLoadingComplete={onLoadingComplete}
      />
    );
  }

  return (
    <NextImage {...nextImageProps} src={src} onLoadingComplete={onLoadingComplete} />
  );
}

type NativeImageProps = Omit<NextImageProps, "src" | "style"> & {
  src: string;
  fallback?: ReactNode;
  style?: CSSProperties;
};

type NativeImageErrorEvent = NativeImageProps["onError"] extends (
  event: infer EventArg,
  ...args: any
) => unknown
  ? EventArg
  : SyntheticEvent<HTMLImageElement>;

function NativeImage({
  src,
  fallback = null,
  alt,
  className,
  style,
  loading,
  width,
  height,
  sizes,
  onError,
  onLoadingComplete,
}: NativeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className={className}
      style={style}
      loading={loading}
      width={typeof width === "number" ? width : undefined}
      height={typeof height === "number" ? height : undefined}
      sizes={sizes}
      onError={(event) => {
        setHasError(true);
        onError?.(event as NativeImageErrorEvent);
      }}
      onLoad={(event) => {
        onLoadingComplete?.(event.currentTarget);
      }}
    />
  );
}
