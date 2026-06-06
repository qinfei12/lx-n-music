import { View } from 'react-native'
import Aside from './Aside'
import PlayerBar from '@/components/player/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import Header from './Header'
import commonState from '@/store/common/state'
import Main from './Main'
import { createStyle } from '@/utils/tools'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'visible',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})

export default ({ componentId }: { componentId: string }) => {
  return (
    <View style={{ flex: 1, overflow: 'visible' }}>
      <StatusBar />
      <View style={styles.container}>
        <Aside />
        <View style={styles.content}>
          <Header />
          <Main />
          <PlayerBar componentId={componentId} isHome />
        </View>
      </View>
    </View>
  )
}
