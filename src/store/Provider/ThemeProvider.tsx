import { memo, useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import themeState, { ThemeContext } from '../theme/state'
import { log } from '@/utils/log'

const DEBUG_TAG = 'DEBUG_ThemeProvider'

export default memo(({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(themeState.theme)

  log.info(DEBUG_TAG, '初始渲染，当前主题:', theme.id, theme['bg-image'])

  useEffect(() => {
    const handleUpdateTheme = (newTheme: LX.ActiveTheme) => {
      log.info(DEBUG_TAG, '主题更新事件触发! 新主题:', newTheme.id, newTheme['bg-image'])
      requestAnimationFrame(() => {
        log.info(DEBUG_TAG, '调用 setTheme')
        setTheme(newTheme)
      })
    }
    log.info(DEBUG_TAG, '注册 themeUpdated 事件监听')
    global.state_event.on('themeUpdated', handleUpdateTheme)
    return () => {
      log.info(DEBUG_TAG, '注销 themeUpdated 事件监听')
      global.state_event.off('themeUpdated', handleUpdateTheme)
    }
  }, [])

  log.info(DEBUG_TAG, '提供主题给 children:', theme.id)
  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </SafeAreaProvider>
  )
})
