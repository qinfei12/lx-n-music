import { Navigation } from 'react-native-navigation'
import * as screenNames from './screenNames'
import * as navigations from './navigation'
import registerScreens from './registerScreens'
import { removeComponentId } from '@/core/common'
import { onAppLaunched } from './regLaunchedEvent'

let unRegisterEvent: ReturnType<
  ReturnType<typeof Navigation.events>['registerScreenPoppedListener']
>

const init = (callback: () => void | Promise<void>) => {
  // Register all screens on launch
  registerScreens()

  if (unRegisterEvent) unRegisterEvent.remove()

  Navigation.setDefaultOptions({
    statusBar: {
      drawBehind: true, // 👈 允许页面内容绘制到状态栏/刘海屏后方
    },
    navigationBar: {
      drawBehind: true, // 👈 允许页面内容绘制到导航栏后方
    },
    android: {
      // 强制通知 RNN 该页面是全屏幕渲染，不要为刘海留白
      fitsSystemWindows: false,
    },
    // animations: {
    //   setRoot: {
    //     waitForRender: true,
    //   },
    // },
  })
  unRegisterEvent = Navigation.events().registerScreenPoppedListener(({ componentId }) => {
    removeComponentId(componentId)
  })
  onAppLaunched(() => {
    console.log('Register app launched listener')
    void callback()
  })
}

export * from './utils'
export * from './event'
export * from './hooks'

export { init, screenNames, navigations }
