export const skkmIconParts = (iconParts) => {
  iconParts.AT_SKKM_FIRE = {
    type: 'path',
    fill: false,
    d: 'M 90,140 h 20 v -70 Z',
    stroke: '#FF0000'
  }
  iconParts.AT_SKKM_EXCLAMATION_MARK = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 100,80 v 40 m 0,10 v 5'
  }
  iconParts.AT_SKKM_CROSS = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 80,80 L 120,120 M 120,80 L 80,120'
  }
  iconParts.AT_SKKM_RECTANGLE = {
    type: 'path',
    fill: false,
    d: 'M 100,150 h 50 v -100 h -100 v 100 Z',
    stroke: '#FF0000'
  }
  iconParts.AT_SKKM_TRIANGLE = {
    type: 'path',
    fill: false,
    d: 'M 100,150 h 50 l -50,-100 l -50,100 Z',
    stroke: '#FF0000'
  }
  iconParts.AT_SKKM_RHOMBUS = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 100,50 L 150,100 L100,150 L 50,100 Z'
  }
  iconParts.AT_SKKM_VERTICAL_LINE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 100,50 v 100'
  }
  iconParts.AT_SKKM_HORIZONTAL_UPPER_LINE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 73,74 h 51'
  }
}

export const skkmSIDCIcons = (sidc, bbox, iconParts) => {
  sidc['K-G-UEFS--'] = [
    iconParts.AT_SKKM_RECTANGLE,
    iconParts.AT_SKKM_FIRE
  ]
  sidc['K-G-UEFM--'] = [
    iconParts.AT_SKKM_RECTANGLE,
    { type: 'translate', x: -10, y: 0, draw: [iconParts.AT_SKKM_FIRE] },
    { type: 'translate', x: 10, y: 0, draw: [iconParts.AT_SKKM_FIRE] }
  ]
  sidc['K-G-UEFH--'] = [
    iconParts.AT_SKKM_RECTANGLE,
    { type: 'translate', x: -20, y: 0, draw: [iconParts.AT_SKKM_FIRE] },
    { type: 'translate', x: 20, y: 0, draw: [iconParts.AT_SKKM_FIRE] },
    iconParts.AT_SKKM_FIRE
  ]
  sidc['K-G-UEDU--'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_EXCLAMATION_MARK
  ]
  sidc['K-G-UEOD--'] = [
    iconParts.AT_SKKM_CROSS,
    iconParts.AT_SKKM_RECTANGLE
  ]
  sidc['K-G-UEOP--'] = [
    { type: 'translate', x: -10, y: 0, draw: [iconParts.AT_SKKM_CROSS] },
    { type: 'translate', x: 10, y: 0, draw: [iconParts.AT_SKKM_CROSS] },
    iconParts.AT_SKKM_RECTANGLE
  ]
  sidc['K-G-UEOX--'] = [
    { type: 'translate', x: -20, y: 0, draw: [iconParts.AT_SKKM_CROSS] },
    { type: 'translate', x: 20, y: 0, draw: [iconParts.AT_SKKM_CROSS] },
    iconParts.AT_SKKM_CROSS,
    iconParts.AT_SKKM_RECTANGLE
  ]
  sidc['K-G-UEB---'] = [
    { type: 'translate', x: 20, y: 30, draw: [{ type: 'scale', factor: 0.7, draw: [iconParts.AT_SKKM_VERTICAL_LINE] }] },
    { type: 'translate', x: 45, y: 30, draw: [{ type: 'scale', factor: 0.7, draw: [iconParts.AT_SKKM_VERTICAL_LINE] }] },
    iconParts.AT_SKKM_RECTANGLE
  ]
  sidc['K-G-UEPI--'] = [
    iconParts.AT_SKKM_RHOMBUS,
    iconParts.AT_SKKM_VERTICAL_LINE
  ]
  sidc['K-G-UEPK--'] = [
    iconParts.AT_SKKM_RHOMBUS,
    iconParts.AT_SKKM_VERTICAL_LINE,
    iconParts.AT_SKKM_HORIZONTAL_UPPER_LINE
  ]
  sidc['K-G-UEPD--'] = [
    iconParts.AT_SKKM_RHOMBUS,
    iconParts.AT_SKKM_VERTICAL_LINE,
    { type: 'translate', x: 0, y: -24, draw: [iconParts.AT_SKKM_HORIZONTAL_UPPER_LINE] }
  ]
}
