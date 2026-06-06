import { memo, useCallback, useRef, useEffect } from 'react'
import { type LayoutChangeEvent, StyleSheet, View, StatusBar, Dimensions } from 'react-native'
import commonState from '@/store/common/state'
import settingState from '@/store/setting/state'
import { setStatusbarHeight } from '@/core/common'
import { windowSizeTools, getWindowSize } from '@/utils/windowSizeTools'
import { log } from '@/utils/log'

const DEBUG_TAG = 'DEBUG_SizeView'

const getStatusbarHeight = (winHeight: number, layoutHeight: number) => {
  const height =
    !settingState.setting['common.alwaysKeepStatusbarHeight'] &&
    parseFloat(winHeight.toFixed(2)) >= parseFloat(layoutHeight.toFixed(2))
      ? 0
      : (StatusBar.currentHeight ?? 0)

  return height
}

export default memo(
  () => {
    const currentHeightRef = useRef(commonState.statusbarHeight)
    const sizeRef = useRef([0, 0])
    const dimensionsChangedRef = useRef(true)
    const viewRef = useRef<View>(null)

    const updateLayout = useCallback(() => {
      log.info(DEBUG_TAG, 'updateLayout 被调用');
      viewRef.current?.measureInWindow((x, y, width, height) => {
        log.info(DEBUG_TAG, 'measureInWindow 得到尺寸:', { x, y, width, height });
        handleLayout({ nativeEvent: { layout: { width, height } } })
      })
    }, [])

    const handleLayout = useCallback(
      ({
        nativeEvent: { layout },
      }: LayoutChangeEvent | { nativeEvent: { layout: { width: number; height: number } } }) => {
        log.info(DEBUG_TAG, 'handleLayout 被触发', layout);
        void getWindowSize().then((size) => {
          log.info(DEBUG_TAG, 'getWindowSize 返回:', size);
          dimensionsChangedRef.current = false
          sizeRef.current = [size.height, layout.height]
          const height = getStatusbarHeight(size.height, layout.height)

          log.info(DEBUG_TAG, '计算 statusBar 高度:', height);
          if (currentHeightRef.current != height) {
            log.info(DEBUG_TAG, '更新 statusBar 高度:', height);
            currentHeightRef.current = height
            setStatusbarHeight(height)
          }
          const currentSize = windowSizeTools.getSize()
          log.info(DEBUG_TAG, '当前存储的尺寸:', currentSize, '实际布局尺寸:', layout);
          if (currentSize.width != layout.width || currentSize.height != layout.height) {
            log.info(DEBUG_TAG, '更新存储的窗口尺寸!');
            windowSizeTools.setWindowSize(layout.width, layout.height)
          }
        })
      },
      []
    )
    useEffect(() => {
      const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
        log.info(DEBUG_TAG, '=== 屏幕尺寸变化 ===');
        log.info(DEBUG_TAG, 'window:', window);
        log.info(DEBUG_TAG, 'screen:', screen);
        dimensionsChangedRef.current = true
        // 屏幕尺寸变化时，强制更新布局
        setTimeout(() => {
          log.info(DEBUG_TAG, '触发 updateLayout');
          updateLayout()
        }, 50)
      })

      const handleSettingUpdate = (keys: Array<keyof LX.AppSetting>) => {
        if (!keys.includes('common.alwaysKeepStatusbarHeight') || !sizeRef.current[1]) return
        const height = getStatusbarHeight(sizeRef.current[0], sizeRef.current[1])

        if (currentHeightRef.current != height) {
          currentHeightRef.current = height
          setStatusbarHeight(height)
        }
      }
      global.state_event.on('configUpdated', handleSettingUpdate)

      return () => {
        subscription.remove()
        global.state_event.off('configUpdated', handleSettingUpdate)
      }
    }, [updateLayout])

    log.info(DEBUG_TAG, 'SizeView 渲染');
    return <View 
      ref={viewRef} 
      style={StyleSheet.absoluteFill} 
      onLayout={handleLayout} 
    />;
  },
  () => true
)
