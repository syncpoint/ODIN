export const skkmIconParts = function (iconParts, metadata) {

  const FILL_WHITE = 'rgba(255, 255, 255, 0.8)'

  iconParts.AT_SKKM_FIRE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 90,140 h 20 v -70 Z'
  }
  iconParts.AT_SKKM_FIRE_TRIANGLE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 85,140 h 20 v -50 Z'
  }
  iconParts.AT_SKKM_EXCLAMATION_MARK = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 100,80 v 40 m 0,10 v 5'
  }
  iconParts.AT_SKKM_RADIATION = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 95,95 L 58,58 M 105,95 L 145,58 M 100,107 L 100,145 M 100,98 L 100,101'
  }
  iconParts.AT_SKKM_RADIATION_TRIANGLE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 95,110 L 75,100 M 105,110 L 125,100 M 100,123 L 100,145 M 100,113 L 100,115'
  }
  iconParts.AT_SKKM_CROSS = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 80,80 L 120,120 M 120,80 L 80,120'
  }
  iconParts.AT_SKKM_SQUARE = {
    type: 'path',
    fill: FILL_WHITE,
    // d: 'M 100,150 h 50 v -100 h -100 v 100 Z',
    d: 'M 45,45 L 155,45 L 155,155 L 45,155, Z',
    stroke: '#FF0000'
  }
  iconParts.AT_SKKM_RECTANGLE = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#0000FF',
    d: 'M 20,45 L 180,45 L 180,155 L 20,155 Z'
  }
  iconParts.AT_SKKM_TRIANGLE = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#FF0000',
    // d: 'M 100,150 h 50 l -50,-100 l -50,100 Z'
    d: 'M 100,155 L 155,155 L 100,45 L 45,155 Z'
  }
  iconParts.AT_SKKM_TRIANGLE_SMALL_FILLED = {
    type: 'path',
    fill: '#000000',
    stroke: '#000000',
    d: 'M 80,70 100,50 120,70 Z'
  }
  iconParts.AT_SKKM_HQ = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#0000FF',
    d: 'M 50,150 L 50,50 L 150,50 L 150,120, L 50,120'
  }
  iconParts.AT_SKKM_HOUSE = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#0000FF',
    d: 'M 50,150 L 50,70 L 150,70 L 150,150 L 50,150, M 50,70 L 100,50 L 150,70'
  }
  iconParts.AT_SKKM_RHOMBUS_RED = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#FF0000',
    d: 'M 100,45 L 155,100 L100,155 L 45,100 Z'
  }
  iconParts.AT_SKKM_RHOMBUS_BLACK = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#000000',
    // d: 'M 100,50 L 150,100 L100,150 L 50,100 Z'
    d: 'M 100,45 L 155,100 L100,155 L 45,100 Z'
  }
  iconParts.AT_SKKM_CIRCLE = {
    type: 'circle',
    fill: false,
    stroke: '#FF0000',
    cx: 100,
    cy: 90,
    r: 17
  }
  iconParts.AT_SKKM_CIRCLE_TRIANGLE = {
    type: 'circle',
    fill: false,
    stroke: '#FF0000',
    cx: 100,
    cy: 105,
    r: 13
  }
  iconParts.AT_SKKM_CIRCLE_BLACK = {
    type: 'circle',
    fill: FILL_WHITE,
    stroke: '#000000',
    cx: 100,
    cy: 100,
    r: 50
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
    d: 'M 75,68 h 50'
  }
  iconParts.AT_SKKM_DIAGONAL_LINES = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 115,165 L 165,115 M 35,85 L 85,35'
  }
  iconParts.AT_SKKM_CURVED_LINE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'm 71.580411,128.85345 c 7.454816,-6.02206 14.910171,-12.04455 21.745207,-10.85004 6.835032,1.1945 13.045362,9.60123 20.200052,11.03048 7.15468,1.42925 15.25321,-4.11589 23.35328,-9.66209'
  }
  iconParts.AT_SKKM_AVALANCHE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 70,140 L 85,65 L 115,65 L 130,140 M 73,130 L 127,130 M 73,120 L 126,120'
  }
  iconParts.AT_SKKM_AVALANCHE_TRIANGLE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 70,140 L 90,90 L 110,90 L 130,140 M 73,130 L 127,130 M 76,120 L 123,120'
  }
  iconParts.AT_SKKM_SMOKE = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 70,135 L 130,135 M 80,120 L 120,120 M 90,105 L 110,105'
  }
  iconParts.AT_SKKM_LIGHTING = {
    type: 'path',
    fill: false,
    stroke: '#FF0000',
    d: 'M 95,130 L 100,140 L 115,130 M 100,140 L 110,110 L 90,110 L 100,80'
  }
  iconParts.AT_SKKM_VEHICLE_MOTOR = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#000000',
    d: 'M 60,130 L 60,70 L 140,70 L 140,130 L 60,130 M 80,130 L 80,70'
  }
  iconParts.AT_SKKM_VEHICLE_TRAILER = {
    type: 'path',
    fill: false,
    stroke: '#000000',
    d: 'M 60,130 L 60,70 L 140,70 L 140,130 L 60,130 M 60,100 L 40,100'
  }
  iconParts.AT_SKKM_VEHICLE_RAIL = {
    type: 'path',
    fill: false,
    stroke: '#000000',
    d: 'M 60,130 L 60,70 L 140,70 L 140,130 L 60,130 M 60,120 L 40,120 M 60,80 L 40,80 M 140,120 L 160,120 M 140,80 L 160,80'
  }
  iconParts.AT_SKKM_VEHICLE_WATERCRAFT = {
    type: 'path',
    fill: false,
    stroke: '#000000',
    d: 'm 92.094439,120.82069 c -4.589196,-0.0237 -9.178918,-0.0475 -12.965293,-0.58243 -3.786374,-0.53497 -6.769232,-1.58138 -12.110235,-5.03901 -5.341003,-3.45762 -13.038212,-9.32537 -16.67639,-12.84877 -3.638179,-3.523403 -3.213418,-4.699581 0.25232,-8.121721 3.465737,-3.42214 9.971675,-9.088984 14.809868,-12.672177 4.838193,-3.583194 8.007733,-5.082097 12.210265,-5.860973 4.202532,-0.778876 9.438032,-0.837717 14.673533,-0.896557 M 92.288508,74.799048 L  152.33351,74.589139 L 152.33351,120.82069 L 92.094439,120.82069'
  }
  iconParts.AT_SKKM_VEHICLE_AIRCRAFT = {
    type: 'path',
    fill: false,
    stroke: '#000000',
    d: 'M 101.0254,97.811483 C 94.06852,95.203292 87.11133,92.594985 81.408001,90.828031 75.704672,89.061078 71.255397,88.135569 67.412697,87.820011 c -3.842699,-0.315559 -7.078536,-0.02108 -9.930275,0.841347 -2.85174,0.862427 -5.319066,2.292761 -6.795513,3.870494 -1.476448,1.577734 -1.961822,3.302544 -1.658322,5.006436 0.3035,1.703891 1.395596,3.386642 2.690021,4.732822 1.294424,1.34618 2.791001,2.35582 4.934808,3.07093 2.143806,0.71511 4.934718,1.1358 8.109947,1.13576 3.175229,-4e-5 6.734652,-0.42073 10.698653,-1.178 3.964002,-0.75727 8.33238,-1.85106 12.660424,-3.15523 4.328045,-1.30417 8.615531,-2.818638 13.26718,-4.585575 4.65165,-1.766937 9.66719,-3.786228 14.56157,-5.447983 4.89437,-1.661755 9.66723,-2.965882 13.24699,-3.744158 3.57977,-0.778277 5.9662,-1.030689 8.27183,-1.051697 2.30562,-0.02101 4.53027,0.189337 6.65386,0.799416 2.1236,0.61008 4.146,1.619727 5.64256,2.818792 1.49657,1.199064 2.46732,2.587329 2.9526,4.038726 0.48528,1.451396 0.48528,2.965865 0.0201,4.290948 -0.46519,1.325081 -1.39549,2.460941 -2.73027,3.554721 -1.33478,1.09378 -3.07404,2.14549 -5.1571,2.86068 -2.08307,0.71519 -4.50996,1.09381 -7.98855,0.98866 -3.4786,-0.10515 -8.00878,-0.69411 -13.08514,-1.78791 -5.07637,-1.09379 -10.69863,-2.6924 -14.58173,-3.95446 -3.8831,-1.262073 -6.02685,-2.187587 -8.17094,-3.113247'
  }
  iconParts.AT_SKKM_VEHICLE_AIRCRAFT_FIXED = {
    type: 'path',
    fill: false,
    stroke: '#000000',
    d: 'M 100,70 L 100,125'
  }
  iconParts.AT_SKKM_VEHICLE_AIRCRAFT_ROTARY = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#000000',
    d: 'M 100,100 L 100,125 M 80,125 L 120,125'
  }
  iconParts.AT_SKKM_EQUIPMENT_LARGE_SCALE = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#000000',
    d: 'M 75,130 L 75,70 M 60,70 140,70 M 125,70 125,130 M 140,130, 60,130'
  }
  iconParts.AT_SKKM_TEXT_G_TRIANGLE = {
    type: 'text',
    text: 'G',
    stroke: '#FF0000',
    x: 117,
    y: 130,
    fontsize: 50,
    fontfamily: 'Arial'
  }
  iconParts.AT_SKKM_TEXT_C_TRIANGLE = {
    type: 'text',
    text: 'C',
    stroke: '#FF0000',
    x: 117,
    y: 130,
    fontsize: 50,
    fontfamily: 'Arial'
  }
  iconParts.AT_SKKM_TEXT_EX_TRIANGLE = {
    type: 'text',
    text: 'EX',
    stroke: '#FF0000',
    x: 124,
    y: 140,
    fontsize: 40,
    fontfamily: 'Arial'
  }
  iconParts.AT_SKKM_TEXT_G = {
    type: 'text',
    text: 'G',
    stroke: '#FF0000',
    x: 117,
    y: 120,
    fontsize: 50,
    fontfamily: 'Arial'
  }
  iconParts.AT_SKKM_TEXT_C = {
    type: 'text',
    text: 'C',
    stroke: '#FF0000',
    x: 117,
    y: 120,
    fontsize: 50,
    fontfamily: 'Arial'
  }
}

export const skkmSIDCIcons = function (existingSIDCs, bbox, iconParts) {
  console.dir(this)
  const sidc = {}
  sidc['K-G-D-----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_EXCLAMATION_MARK
  ]
  sidc['K-G-DI----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_CIRCLE_TRIANGLE,
    { type: 'translate', x: -10, y: 15, draw: [iconParts.AT_SKKM_CIRCLE_TRIANGLE] },
    { type: 'translate', x: 10, y: 15, draw: [iconParts.AT_SKKM_CIRCLE_TRIANGLE] }
  ]
  sidc['K-G-DF----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_FIRE_TRIANGLE
  ]
  sidc['K-G-DC----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_TEXT_C_TRIANGLE
  ]
  sidc['K-G-DG----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_TEXT_G_TRIANGLE
  ]
  sidc['K-G-DA----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_AVALANCHE_TRIANGLE
  ]
  sidc['K-G-DR----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_RADIATION_TRIANGLE
  ]
  sidc['K-G-DW----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    { type: 'translate', x: -6, y: 12, draw: [iconParts.AT_SKKM_CURVED_LINE] },
    { type: 'translate', x: -6, y: 2, draw: [iconParts.AT_SKKM_CURVED_LINE] }
  ]
  sidc['K-G-DE----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_TEXT_EX_TRIANGLE
  ]
  sidc['K-G-DS----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_SMOKE
  ]
  sidc['K-G-DX----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_LIGHTING
  ]
  sidc['K-G-H-----'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_EXCLAMATION_MARK
  ]
  sidc['K-G-HI----'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_CIRCLE,
    { type: 'translate', x: -10, y: 20, draw: [iconParts.AT_SKKM_CIRCLE] },
    { type: 'translate', x: 10, y: 20, draw: [iconParts.AT_SKKM_CIRCLE] }
  ]
  sidc['K-G-HFL---'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_FIRE
  ]
  sidc['K-G-HFM---'] = [
    iconParts.AT_SKKM_SQUARE,
    { type: 'translate', x: -10, y: 0, draw: [iconParts.AT_SKKM_FIRE] },
    { type: 'translate', x: 10, y: 0, draw: [iconParts.AT_SKKM_FIRE] }
  ]
  sidc['K-G-HFH---'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_FIRE,
    { type: 'translate', x: -20, y: 0, draw: [iconParts.AT_SKKM_FIRE] },
    { type: 'translate', x: 20, y: 0, draw: [iconParts.AT_SKKM_FIRE] }
  ]
  sidc['K-G-HC----'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_TEXT_C
  ]
  sidc['K-G-HG----'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_TEXT_G
  ]
  sidc['K-G-HA----'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_AVALANCHE
  ]
  sidc['K-G-HR----'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_RADIATION
  ]
  sidc['K-G-HW----'] = [
    iconParts.AT_SKKM_SQUARE,
    { type: 'translate', x: 0, y: -30, draw: [iconParts.AT_SKKM_CURVED_LINE] },
    { type: 'translate', x: 0, y: -15, draw: [iconParts.AT_SKKM_CURVED_LINE] }
  ]
  sidc['K-G-HBD---'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_CROSS
  ]
  sidc['K-G-HBP---'] = [
    iconParts.AT_SKKM_SQUARE,
    { type: 'translate', x: -10, y: 0, draw: [iconParts.AT_SKKM_CROSS] },
    { type: 'translate', x: 10, y: 0, draw: [iconParts.AT_SKKM_CROSS] }
  ]
  sidc['K-G-HBC---'] = [
    iconParts.AT_SKKM_SQUARE,
    { type: 'translate', x: 20, y: 30, draw: [{ type: 'scale', factor: 0.7, draw: [iconParts.AT_SKKM_VERTICAL_LINE] }] },
    { type: 'translate', x: 45, y: 30, draw: [{ type: 'scale', factor: 0.7, draw: [iconParts.AT_SKKM_VERTICAL_LINE] }] }
  ]
  sidc['K-G-HBY---'] = [
    iconParts.AT_SKKM_SQUARE,
    iconParts.AT_SKKM_CROSS,
    { type: 'translate', x: -20, y: 0, draw: [iconParts.AT_SKKM_CROSS] },
    { type: 'translate', x: 20, y: 0, draw: [iconParts.AT_SKKM_CROSS] }
  ]
  // person
  sidc['K-G-P-----'] = [
    iconParts.AT_SKKM_RHOMBUS_BLACK
  ]
  // person/commander
  sidc['K-G-PC----'] = [
    iconParts.AT_SKKM_RHOMBUS_BLACK,
    iconParts.AT_SKKM_TRIANGLE_SMALL_FILLED
  ]
  // person - injured
  sidc['K-G-PI----'] = [
    iconParts.AT_SKKM_RHOMBUS_RED,
    iconParts.AT_SKKM_VERTICAL_LINE
  ]
  // person killed
  sidc['K-G-PK----'] = [
    iconParts.AT_SKKM_RHOMBUS_RED,
    iconParts.AT_SKKM_VERTICAL_LINE,
    iconParts.AT_SKKM_HORIZONTAL_UPPER_LINE
  ]
  // person in forced pos
  sidc['K-G-PF----'] = [
    iconParts.AT_SKKM_RHOMBUS_RED,
    { type: 'translate', x: 0, y: -24, draw: [iconParts.AT_SKKM_HORIZONTAL_UPPER_LINE] }
  ]
  // person missing
  sidc['K-G-PM----'] = [
    iconParts.AT_SKKM_RHOMBUS_RED,
    iconParts.AT_SKKM_DIAGONAL_LINES
  ]
  // formation
  sidc['K-G-FU----'] = [
    iconParts.AT_SKKM_RECTANGLE
  ]
  // command post / HQ
  sidc['K-G-FH----'] = [
    iconParts.AT_SKKM_HQ
  ]
  // permanent/fixed facility
  sidc['K-G-FI----'] = [
    iconParts.AT_SKKM_HOUSE
  ]
  // temporary facility
  sidc['K-G-FS----'] = [
    iconParts.AT_SKKM_CIRCLE_BLACK
  ]
  // vehicle
  sidc['K-G-VM----'] = [
    iconParts.AT_SKKM_VEHICLE_MOTOR
  ]
  // trailer
  sidc['K-G-VT----'] = [
    iconParts.AT_SKKM_VEHICLE_TRAILER
  ]
  sidc['K-G-VL----'] = [
    iconParts.AT_SKKM_VEHICLE_RAIL
  ]
  sidc['K-G-VS----'] = [
    iconParts.AT_SKKM_VEHICLE_WATERCRAFT
  ]
  sidc['K-G-VF----'] = [
    iconParts.AT_SKKM_VEHICLE_AIRCRAFT,
    iconParts.AT_SKKM_VEHICLE_AIRCRAFT_FIXED
  ]
  sidc['K-G-VR----'] = [
    iconParts.AT_SKKM_VEHICLE_AIRCRAFT,
    iconParts.AT_SKKM_VEHICLE_AIRCRAFT_ROTARY
  ]
  sidc['K-G-E-----'] = [
    iconParts.AT_SKKM_EQUIPMENT_LARGE_SCALE
  ]

  for (const [key, value] of Object.entries(sidc)) {
    bbox[key] = { x1: 20, y1: 45, x2: 180, y2: 155 }
    existingSIDCs[key] = value
  }
}

export const skkmLabels = function (sidc) {

  console.log('SKKM labels', this)

  const incidentLabels = {
    dtg: { stroke: false, textanchor: 'end', x: 25, y: 80, fontsize: 40 },
    speed: { stroke: false, textanchor: 'end', x: 25, y: 155, fontsize: 40 },
    additionalInformation: { stroke: false, textanchor: 'start', x: 180, y: 155, fontsize: 40 },
    uniqueDesignation: { stroke: false, textanchor: 'end', x: 25, y: 120, fontsize: 40 }
  }

  const personLabels = {
    dtg: { stroke: false, textanchor: 'end', x: 25, y: 80, fontsize: 40 },
    speed: { stroke: false, textanchor: 'end', x: 25, y: 155, fontsize: 40 },
    additionalInformation: { stroke: false, textanchor: 'start', x: 180, y: 155, fontsize: 40 },
    higherFormation: { stroke: false, textanchor: 'start', x: 180, y: 120, fontsize: 40 },
    uniqueDesignation: { stroke: false, textanchor: 'end', x: 25, y: 120, fontsize: 40 }
  }

  const unitEquipmentLabels = {
    dtg: { stroke: false, textanchor: 'end', x: 5, y: 80, fontsize: 40 },
    speed: { stroke: false, textanchor: 'end', x: 5, y: 155, fontsize: 40 },
    additionalInformation: { stroke: false, textanchor: 'start', x: 195, y: 155, fontsize: 40 },
    higherFormation: { stroke: false, textanchor: 'start', x: 195, y: 120, fontsize: 40 },
    uniqueDesignation: { stroke: false, textanchor: 'end', x: 5, y: 120, fontsize: 40 }
  }

  const facilityLabels = {
    dtg: { stroke: false, textanchor: 'end', x: 5, y: 80, fontsize: 40 },
    additionalInformation: { stroke: false, textanchor: 'start', x: 195, y: 155, fontsize: 40 },
    higherFormation: { stroke: false, textanchor: 'start', x: 195, y: 120, fontsize: 40 },
    uniqueDesignation: { stroke: false, textanchor: 'end', x: 5, y: 120, fontsize: 40 }
  }

  const dangerSIDCs = [
    'K-G-D-----',
    'K-G-DI----',
    'K-G-DF----',
    'K-G-DC----',
    'K-G-DG----',
    'K-G-DA----',
    'K-G-DR----',
    'K-G-DW----',
    'K-G-DE----',
    'K-G-DS----',
    'K-G-DX----'
  ]

  const damageSIDCs = [
    'K-G-H-----',
    'K-G-HI----',
    'K-G-HFL---',
    'K-G-HFM---',
    'K-G-HFH---',
    'K-G-HC----',
    'K-G-HG----',
    'K-G-HA----',
    'K-G-HR----',
    'K-G-HW----',
    'K-G-HBD---',
    'K-G-HBP---',
    'K-G-HBC---',
    'K-G-HBY---'
  ]

  const personSIDCs = [
    'K-G-P-----',
    'K-G-PC----',
    'K-G-PI----',
    'K-G-PK----',
    'K-G-PF----',
    'K-G-PM----'
  ]

  const formationSIDCs = [
    'K-G-FU----',
    'K-G-FH----'
  ]

  const facilitySIDCs = [
    'K-G-FI----',
    'K-G-FS----'
  ]

  const equipmentSIDCs = [
    'K-G-VM----',
    'K-G-VT----',
    'K-G-VL----',
    'K-G-VF----',
    'K-G-VS----',
    'K-G-VR----',
    'K-G-E-----'
  ]

  dangerSIDCs.forEach(code => { sidc[code] = incidentLabels })
  damageSIDCs.forEach(code => { sidc[code] = incidentLabels })
  personSIDCs.forEach(code => { sidc[code] = personLabels })
  formationSIDCs.forEach(code => { sidc[code] = unitEquipmentLabels })
  facilitySIDCs.forEach(code => { sidc[code] = facilityLabels })
  equipmentSIDCs.forEach(code => { sidc[code] = unitEquipmentLabels })
}
