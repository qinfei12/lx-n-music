/**
 * Created by qianxin on 17/6/1.
 * 屏幕工具类
 * ui设计基准,iphone 6
 * width:375
 * height:667
 */
import { PixelRatio } from 'react-native'
import { windowSizeTools } from './windowSizeTools'

// 高保真的宽度和高度
const designWidth = 375.0
const designHeight = 667.0

/**
 * 获取当前屏幕尺寸（动态获取）
 */
function getCurrentScreenDimensions() {
  const size = windowSizeTools.getSize()
  let screenW = size.width || 375
  let screenH = size.height || 667
  
  // 无论横竖屏，始终将短边作为宽，长边作为高（保持设计稿比例计算一致）
  if (screenW > screenH) {
    const temp = screenW
    screenW = screenH
    screenH = temp
  }
  
  const fontScale = PixelRatio.getFontScale()
  const pixelRatio = PixelRatio.get()
  const screenPxW = PixelRatio.getPixelSizeForLayoutSize(screenW)
  const screenPxH = PixelRatio.getPixelSizeForLayoutSize(screenH)
  const scaleW = screenPxW / designWidth
  const scaleH = screenPxH / designHeight
  const scale = Math.min(scaleW, scaleH, 3.1)
  
  return {
    screenW,
    screenH,
    fontScale,
    pixelRatio,
    screenPxW,
    screenPxH,
    scale
  }
}

/**
 * 设置text
 * @param size  px
 * @returns dp
 */
export function getTextSize(size: number) {
  const { screenW, screenH, fontScale } = getCurrentScreenDimensions()
  let scaleWidth = screenW / designWidth
  let scaleHeight = screenH / designHeight
  let scale = Math.min(scaleWidth, scaleHeight, 1.3)
  size = Math.floor((size * scale) / fontScale)
  return size
}

export function setSpText(size: number) {
  return getTextSize(size) * global.lx.fontSize
}

/**
 * 设置高度
 * @param size  px
 * @returns dp
 */
export function scaleSizeH(size: number) {
  const { scale, pixelRatio } = getCurrentScreenDimensions()
  let scaleHeight = size * scale
  size = Math.floor(scaleHeight / pixelRatio)
  return size * global.lx.fontSize
}

/**
 * 设置宽度
 * @param size  px
 * @returns dp
 */
export function scaleSizeW(size: number) {
  const { scale, pixelRatio } = getCurrentScreenDimensions()
  let scaleWidth = size * scale
  size = Math.floor(scaleWidth / pixelRatio)
  return size * global.lx.fontSize
}

export const scaleSizeWR = (size: number) => {
  return size * 2 - scaleSizeW(size)
}

export const scaleSizeHR = (size: number) => {
  return size * 2 - scaleSizeH(size)
}

export const scaleSizeAbsHR = (size: number) => {
  const { scale, pixelRatio } = getCurrentScreenDimensions()
  let scaleHeight = size * scale
  return size * 2 - Math.floor(scaleHeight / pixelRatio)
}
