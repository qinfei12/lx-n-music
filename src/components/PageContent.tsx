
import { View, Dimensions, StatusBar, type ScaledSize } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { useMemo, useEffect, useState } from 'react'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'
import { useBgPic } from '@/store/common/hook'
import { log } from '@/utils/log'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSettingValue } from '@/store/setting/hook'
interface Props {
  children: React.ReactNode
}

const DEBUG_TAG = 'DEBUG_PageContent'

export default ({ children }: Props) => {
  const theme = useTheme();
  const windowSize = useWindowSize();
  const [screenSize, setScreenSize] = useState<ScaledSize>(Dimensions.get('screen'));
  const insets = useSafeAreaInsets();
  const dynamicPic = useBgPic();
  const customBgPicPath = useSettingValue('theme.customBgPicPath');
  const pic = customBgPicPath || dynamicPic;
  const picOpacity = useSettingValue('theme.picOpacity');
  const blur = useSettingValue('theme.blur');
  const BLUR_RADIUS = blur

  // 监听屏幕尺寸变化（横竖屏切换）
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      log.info(DEBUG_TAG, '屏幕尺寸变化，更新 screenSize:', screen);
      setScreenSize(screen);
    });
    return () => subscription.remove();
  }, []);

  // 调试日志：尺寸与主题信息
  useEffect(() => {
    const isLandscape = screenSize.width > screenSize.height;
    
    log.info(DEBUG_TAG, '=== 横屏适配核心数据 ===');
    log.info(DEBUG_TAG, '当前是否为横屏:', isLandscape);
    log.info(DEBUG_TAG, '物理全屏宽度 (screenSize.width):', screenSize.width);
    log.info(DEBUG_TAG, '可用窗口宽度 (windowSize.width):', windowSize.width);
    log.info(DEBUG_TAG, '【核心拦截点】横屏左侧安全间距 (insets.left):', insets.left);
    log.info(DEBUG_TAG, '【核心拦截点】横屏右侧安全间距 (insets.right):', insets.right);
    log.info(DEBUG_TAG, '物理与可用的绝对差值:', screenSize.width - windowSize.width);
    log.info(DEBUG_TAG, 'Theme bg-image:', theme['bg-image']);
    log.info(DEBUG_TAG, '====================');
  }, [screenSize, windowSize, insets, theme, pic]);

  const contentComponent = useMemo(() => {
    log.info(DEBUG_TAG, '重新渲染 contentComponent');
    
    const bgSource = pic ? { uri: pic, headers: defaultHeaders } : theme['bg-image'];
    log.info(DEBUG_TAG, 'bgSource:', bgSource);
    
    const isLandscape = screenSize.width > screenSize.height;

    // ========================================================
    // 【剥离分工】背景图负责铺满物理屏幕，控件负责安全避让
    // ========================================================
    const bgLeft = 0;
    const bgTop = 0;
    const bgWidth = screenSize.width;
    const bgHeight = screenSize.height;

    // 【修复】不在 PageContent 层加 paddingLeft，避免把整个画布往右推导致左侧真空区
    // layoutDiff 将下放到具体需要避让刘海的子组件中
    const layoutDiff = screenSize.width - windowSize.width;
    const contentPaddingLeft = 0; // 外层容器归零，画布从 x=0 开始

    log.info(DEBUG_TAG, '【修复画布真空】背景图铺满物理屏幕，外层画布归零:', { bgLeft, bgTop, bgWidth, bgHeight, isLandscape, layoutDiff, contentPaddingLeft, insetsLeft: insets.left });

    return (
      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: 'transparent' }}>
        {/* 背景图容器：死死铺满整个物理屏幕（包括刘海区域） */}
        <View
          style={{
            position: 'absolute',
            left: bgLeft,
            top: bgTop,
            height: bgHeight,
            width: bgWidth,
            backgroundColor: theme['c-content-background'],
          }}
        >
          <ImageBackground
            style={{
              width: bgWidth,
              height: bgHeight,
              backgroundColor: theme['c-content-background'],
            }}
            imageStyle={{
              width: bgWidth,
              height: bgHeight,
              resizeMode: 'cover',
            }}
            source={bgSource}
            resizeMode="cover"
            blurRadius={pic ? BLUR_RADIUS : undefined}
          >
            {pic ? (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme['c-content-background'],
                  opacity: picOpacity / 100,
                }}
              />
            ) : null}
          </ImageBackground>
        </View>

        {/* 主内容区域：纯透明背景，用 paddingLeft 避让刘海，控件不会撞进死角 */}
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: 'transparent',
            paddingLeft: contentPaddingLeft,
          }}
        >
          {children}
        </View>
      </View>
    );
  }, [children, pic, theme, screenSize, BLUR_RADIUS, picOpacity]); // 👈 优化依赖项：剔除不稳定的 windowSize 和 insets

  return (
    <>
      <SizeView />
      {contentComponent}
    </>
  );
}
