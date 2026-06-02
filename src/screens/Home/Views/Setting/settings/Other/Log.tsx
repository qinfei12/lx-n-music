import { memo, useRef, useState, useEffect } from 'react'
import { View, Clipboard, Text as RNText } from 'react-native'
import { getLogs, clearLogs } from '@/utils/log'
// import { gzip, ungzip } from 'pako'

import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { createStyle, toast } from '@/utils/tools'
import LogConfirmAlert, { type LogConfirmAlertType } from '@/components/common/LogConfirmAlert'
import CheckBoxItem from '../../components/CheckBoxItem'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import settingState from '@/store/setting/state'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const alertRef = useRef<LogConfirmAlertType>(null)
  const [logText, setLogText] = useState('')
  const isUnmountedRef = useRef(true)
  const [isEnableSyncErrorLog, setIsEnableSyncErrorLog] = useState(global.lx.isEnableSyncLog)
  const [isEnableUserApiLog, setIsEnableUserApiLog] = useState(global.lx.isEnableUserApiLog)
  const [isEnableWebDAVLog, setIsEnableWebDAVLog] = useState(settingState.setting['common.isEnableWebDAVLog'])

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setString(text)
      toast(t('setting_other_log_tip_copy_success'))
    } catch {
      toast(t('setting_other_log_tip_copy_failed'))
    }
  }

  const handleCopyAll = () => {
    copyToClipboard(logText)
  }

  const getErrorLog = () => {
    void getLogs().then((log) => {
      if (isUnmountedRef.current) return
      const logArr = log.split(/^----lx log----\n|\n----lx log----\n|\n----lx log----$/)
      // console.log(logArr)
      logArr.reverse()
      const formattedLog = logArr
        .filter(line => line.trim())
        .join('\n\n')
        .replace(/^\n+|\n+$/, '')
      setLogText(formattedLog)
    })
  }

  const openLogModal = () => {
    getErrorLog()
    alertRef.current?.setVisible(true)
  }

  const handleCleanLog = () => {
    void clearLogs().then(() => {
      toast(t('setting_other_log_tip_clean_success'))
      getErrorLog()
    })
  }

  const handleSetEnableSyncErrorLog = (enable: boolean) => {
    setIsEnableSyncErrorLog(enable)
    global.lx.isEnableSyncLog = enable
  }

  const handleSetEnableUserApiLog = (enable: boolean) => {
    setIsEnableUserApiLog(enable)
    global.lx.isEnableUserApiLog = enable
  }

  const handleSetEnableWebDAVLog = (enable: boolean) => {
    setIsEnableWebDAVLog(enable)
    updateSetting({ 'common.isEnableWebDAVLog': enable })
  }

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  return (
    <>
      <SubTitle title={t('setting_other_log')}>
        <View style={styles.checkBox}>
          <CheckBoxItem
            check={isEnableSyncErrorLog}
            label={t('setting_other_log_sync_log')}
            onChange={handleSetEnableSyncErrorLog}
          />
          <CheckBoxItem
            check={isEnableUserApiLog}
            label={t('setting_other_log_user_api_log')}
            onChange={handleSetEnableUserApiLog}
          />
          <CheckBoxItem
            check={isEnableWebDAVLog}
            label={t('setting_other_log_webdav_log')}
            onChange={handleSetEnableWebDAVLog}
          />
        </View>
        <View style={styles.btn}>
          <Button onPress={openLogModal}>{t('setting_other_log_btn_show')}</Button>
        </View>
      </SubTitle>
      <LogConfirmAlert
        ref={alertRef}
        cancelText={t('setting_other_log_btn_hide')}
        confirmText={t('setting_other_log_btn_clean')}
        onConfirm={handleCleanLog}
        showConfirm={!!logText}
        reverseBtn={true}
        middleText={t('setting_other_log_btn_copy_all')}
        onMiddle={handleCopyAll}
        showMiddle={!!logText}
      >
        <View style={styles.renameContent} onStartShouldSetResponder={() => true}>
          {logText ? (
            <RNText 
              selectable={true} 
              style={{ fontSize: 13, lineHeight: 18 }}
            >
              {logText}
            </RNText>
          ) : (
            <Text size={13}>{t('setting_other_log_tip_null')}</Text>
          )}
        </View>
      </LogConfirmAlert>
    </>
  )
})

const styles = createStyle({
  checkBox: {
    // paddingTop: 10,
    paddingBottom: 15,
    marginLeft: -25,
  },
  btn: {
    flexDirection: 'row',
  },
  renameContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
})
