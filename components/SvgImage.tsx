import React from 'react';
import { Image, ImageProps, View, StyleSheet } from 'react-native';
import { SvgProps } from 'react-native-svg';

type SvgImageProps = Omit<ImageProps, 'source'> & {
    source: any; // SVG 컴포넌트 또는 이미지 require 결과
};

export const SvgImage: React.FC<SvgImageProps> = ({
    source,
    style,
    resizeMode = 'cover',
    ...props
}) => {
    // SVG 컴포넌트인지 확인 (default export가 있는 경우)
    const isSvg = source && typeof source === 'object' && source.default;

    if (isSvg) {
        const SvgComponent = source.default as React.FC<SvgProps>;
        const flatStyle = StyleSheet.flatten(style);

        return (
            <View style={style}>
                <SvgComponent
                    width="100%"
                    height="100%"
                    preserveAspectRatio={
                        resizeMode === 'cover' ? 'xMidYMid slice' :
                        resizeMode === 'contain' ? 'xMidYMid meet' :
                        resizeMode === 'stretch' ? 'none' :
                        'xMidYMid slice'
                    }
                />
            </View>
        );
    }

    // PNG 이미지는 기존 Image 사용
    return (
        <Image
            source={source}
            style={style}
            resizeMode={resizeMode}
            {...props}
        />
    );
};