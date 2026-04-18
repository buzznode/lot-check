import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  bg?: string;
}

export function LotCheckMark({ size = 28, color = '#FFFFFF', bg = '#0F6E56' }: Props) {
  const width = (28 / 34) * size;

  return (
    <Svg width={width} height={size} viewBox="0 0 28 34">
      {/* Clipboard body */}
      <Rect x="1.5" y="5" width="25" height="27.5" rx="2.5"
        stroke={color} strokeWidth="1.6" fill="none" />
      {/* Clip — fill matches bg to erase the body's top edge beneath it */}
      <Rect x="10" y="1" width="8" height="7" rx="2"
        fill={bg} stroke={color} strokeWidth="1.6" />
      {/* Clip hole */}
      <Rect x="12" y="2.5" width="4" height="3.5" rx="1"
        stroke={color} strokeWidth="1.2" fill="none" />
      {/* Checkmark */}
      <Path
        d="M 5,21 L 11,27 L 23,15"
        stroke={color}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
