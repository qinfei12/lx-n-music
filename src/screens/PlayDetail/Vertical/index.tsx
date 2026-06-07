import {memo, useState, useRef, useMemo, useEffect, useCallback} from 'react'
import { View, AppState, Animated, PanResponder, Easing, Text } from 'react-native'

import Header from './components/Header'
// import Aside from './components/Aside'
// import Main from './components/Main'
import MiniLyric from '../components/MiniLyric';
import Player from './Player'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'
import Pic from './Pic'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { playNext, playPrev } from '@/core/player/player'
import { useSettingValue } from '@/store/setting/hook'
// import { useTheme } from '@/store/theme/hook'

const LyricPage = ({ activeIndex }: { activeIndex: number }) => {
  const initedRef = useRef(false)
  const lyric = useMemo(() => <Lyric />, [])
  switch (activeIndex) {
    // case 3:
    case 1:
      if (!initedRef.current) initedRef.current = true
      return lyric
    default:
      return initedRef.current ? lyric : null
  }
  // return activeIndex == 0 || activeIndex == 1 ? setting : null
}

// global.iskeep = false
export default memo(({ componentId }: { componentId: string }) => {
  // const theme = useTheme()
  const [pageIndex, setPageIndex] = useState(0)
  const pagerViewRef = useRef<PagerView>(null);
  const showLyricRef = useRef(false)
  const { height: winHeight } = useWindowSize()
  const isEnableSlideSwitchSong = useSettingValue('player.isEnableSlideSwitchSong')
  
  // 滑动切换歌曲相关
  const slideOffset = useRef(new Animated.Value(0)).current;
  const maxSlide = winHeight * 0.45;
  const slideThreshold = winHeight * 0.09;
  const [slideHintText, setSlideHintText] = useState('');
  const [slideHintVisible, setSlideHintVisible] = useState(false);
  
  // 回弹动画函数
  const resetSlide = useCallback(() => {
    setSlideHintVisible(false);
    Animated.spring(slideOffset, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [slideOffset]);

  // 滑动手势识别
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 只在封面页（pageIndex === 0）且启用滑动切歌时响应滑动
        // 更宽松的条件：只要垂直移动超过阈值，不管水平移动多少都响应
        return isEnableSlideSwitchSong && pageIndex === 0 && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // 手势开始
      },
      onPanResponderMove: (_, gestureState) => {
        slideOffset.setValue(gestureState.dy * 0.8);
        
        // 更新滑动提示文字
        if (gestureState.dy < -slideThreshold) {
          setSlideHintText('下一首');
          setSlideHintVisible(true);
        } else if (gestureState.dy > slideThreshold) {
          setSlideHintText('上一首');
          setSlideHintVisible(true);
        } else {
          setSlideHintVisible(false);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -slideThreshold) {
          void playNext();
        } else if (gestureState.dy > slideThreshold) {
          void playPrev();
        }
        resetSlide();
      },
      onPanResponderTerminate: () => {
        // 手势被中断时也要回弹
        resetSlide();
      },
      onPanResponderTerminationRequest: () => {
        // 允许手势被中断
        return true;
      },
    })
  ).current;

  // 滑动动画效果
  const slideStyle = useMemo(() => {
    const scale = slideOffset.interpolate({
      inputRange: [-maxSlide, 0, maxSlide],
      outputRange: [0.95, 1, 0.95],
    });
    const opacity = slideOffset.interpolate({
      inputRange: [-maxSlide, -maxSlide * 0.5, 0, maxSlide * 0.5, maxSlide],
      outputRange: [0.9, 0.95, 1, 0.95, 0.9],
    });
    return {
      transform: [
        { translateY: slideOffset },
        { scale },
      ],
      opacity,
    };
  }, [slideOffset, maxSlide]);

  const onPageSelected = ({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    setPageIndex(nativeEvent.position)
    showLyricRef.current = nativeEvent.position == 1
    if (showLyricRef.current) {
      screenkeepAwake()
    } else {
      screenUnkeepAwake()
    }
  }

  const handleSwitchToLyricPage = useCallback(() => {
    pagerViewRef.current?.setPage(1);
  }, []);

  useEffect(() => {
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (showLyricRef.current && !commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  }, [])

  return (
    <>
      <Header />
      <View 
        style={styles.container} 
        {...panResponder.panHandlers}
      >
        <PagerView
          onPageSelected={onPageSelected}
          // onPageScrollStateChanged={onPageScrollStateChanged}
          style={styles.pagerView}
          ref={pagerViewRef}
        >
          <View collapsable={false}>
            <Animated.View collapsable={false} style={[styles.picPageContainer, slideStyle]}>
              <Pic componentId={componentId} />
              <MiniLyric
                onPress={handleSwitchToLyricPage}
                style={styles.miniLyricContainer}
              />
              {/* 滑动提示 */}
              {slideHintVisible && (
                <Animated.Text style={[styles.slideHint]}>
                  {slideHintText}
                </Animated.Text>
              )}
            </Animated.View>
          </View>
          <View collapsable={false}>
            <LyricPage activeIndex={pageIndex} />
          </View>
        </PagerView>
        {/* <View style={styles.pageIndicator} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pageIndicator}>
          <View style={{ ...styles.pageIndicatorItem, backgroundColor: pageIndex == 0 ? theme['c-primary-light-100-alpha-700'] : theme['c-primary-alpha-900'] }}></View>
          <View style={{ ...styles.pageIndicatorItem, backgroundColor: pageIndex == 1 ? theme['c-primary-light-100-alpha-700'] : theme['c-primary-alpha-900'] }}></View>
        </View> */}
        <Player componentId={componentId} />
      </View>
    </>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  pagerView: {
    flex: 1,
  },
  picPageContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  miniLyricContainer: {
    position: 'absolute',
    bottom: '6%',
    left: '10%',
    right: '10%',
    alignItems: 'flex-start',
  },
  slideHint: {
    position: 'absolute',
    top: '5%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // pageIndicator: {
  //   flex: 0,
  //   flexDirection: 'row',
  //   justifyContent: 'center',
  //   paddingTop: 10,
  //   // backgroundColor: 'rgba(0,0,0,0.1)',
  // },
  // pageIndicatorItem: {
  //   height: 3,
  //   width: '5%',
  //   marginLeft: 2,
  //   marginRight: 2,
  //   borderRadius: 2,
  // },
})
