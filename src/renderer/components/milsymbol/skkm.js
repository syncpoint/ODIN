export const skkmIconParts = function (iconParts, metadata) {

  const FILL_WHITE = 'rgba(255, 255, 255, 255)'

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
    d: 'M 25,45 L 180,45 L 180,150 L 25,150 Z'
  }
  iconParts.AT_SKKM_RECTANGLE_WHITE = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#FFFFFF',
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
    fill: '#0000FF',
    stroke: '#0000FF',
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
    d: 'M 30,155 L 30,60 L 170,60 L 170,155 L 30,155, M 30,60 L 100,30 L 170,60'
  }
  iconParts.AT_SKKM_RHOMBUS_RED = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#FF0000',
    d: 'M 100,45 L 155,100 L100,155 L 45,100 Z'
  }
  iconParts.AT_SKKM_RHOMBUS_BLUE = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#0000FF',
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
  iconParts.AT_SKKM_CIRCLE_BLUE = {
    type: 'circle',
    fill: FILL_WHITE,
    stroke: '#0000FF',
    cx: 100,
    cy: 100,
    r: 56
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
    stroke: '#0000FF',
    d: 'M 30,55 L 170,55 L 170,145 L 30,145 Z M 55,55 L 55,145'
    // d: 'M 55,145 L 55,65 L 145,65 L 145,135 L 55,135 M 75,135 L 75,65'
  }
  iconParts.AT_SKKM_VEHICLE_TRAILER = {
    type: 'path',
    fill: false,
    stroke: '#0000FF',
    d: 'M 50,150 L 50,50 L 160,50 L 160,150 L 50,150 M 50,100 L 30,100'
  }
  iconParts.AT_SKKM_VEHICLE_RAIL = {
    type: 'path',
    fill: false,
    stroke: '#0000FF',
    d: 'M 50,150 L 50,60 L 150,60 L 150,150 L 50,150 M 50,130 L 30,130 M 50,80 L 30,80 M 150,130 L 170,130 M 150,80 L 170,80'
  }
  iconParts.AT_SKKM_VEHICLE_WATERCRAFT = {
    type: 'path',
    fill: false,
    stroke: '#0000FF',
    d: 'm 90.582994,133.80481 c -6.674989,-0.26375 -13.350741,-0.52754 -18.659718,-1.56734 -5.308977,-1.0398 -9.57301,-2.60043 -17.412026,-6.62096 -7.839015,-4.02054 -19.012718,-11.5931 -21.800195,-15.69464 -2.787478,-4.10155 -2.733551,-5.62835 0.01141,-9.91218 2.74496,-4.283823 12.282466,-11.462104 19.44743,-15.59486 7.164963,-4.132755 11.771102,-6.077521 17.6258,-7.415138 5.854697,-1.337617 13.462324,-1.74648 21.069961,-2.155344 M 90.582994,74.844348 L  174.01863,74.844348 L 174.01863,133.80481 L 90.582994,133.80481'
  }
  iconParts.AT_SKKM_VEHICLE_AIRCRAFT = {
    type: 'path',
    fill: false,
    stroke: '#0000FF',
    d: 'M 99.778308,100.3735 C 91.286233,96.582895 82.793781,92.792121 75.86405,90.327413 68.934319,87.862704 63.562494,86.414978 59.061254,86.056206 c -4.501241,-0.358773 -8.419795,0.05753 -11.646501,1.283033 -3.226706,1.225507 -6.230093,3.370479 -7.741499,5.536587 -1.511406,2.166108 -2.195915,4.757328 -1.98578,7.061566 0.210134,2.304238 1.395384,4.919048 2.894903,6.826968 1.49952,1.90792 3.367984,3.3659 5.787837,4.43742 2.419852,1.07151 5.804526,1.66588 9.553108,1.73286 3.748582,0.067 8.061344,-0.52846 12.840887,-1.59799 4.779543,-1.06952 10.06742,-2.72198 15.299927,-4.66727 5.232507,-1.94529 10.438332,-4.20145 16.118574,-6.764078 5.68025,-2.562626 11.83228,-5.448733 17.77149,-7.887665 5.9392,-2.438932 11.69285,-4.478069 16.00665,-5.5772 4.3138,-1.099131 7.18931,-1.557557 9.91369,-1.5697 2.72438,-0.01214 5.40344,0.391456 7.85878,1.299388 2.45534,0.907932 4.90196,2.440498 6.58693,4.176976 1.68497,1.736479 2.89945,3.819518 3.45714,5.8711 0.55768,2.051582 0.56625,4.349319 0.0455,6.209779 -0.52078,1.86046 -1.59551,3.615 -3.1186,5.22713 -1.5231,1.61214 -3.68941,3.11892 -6.10589,4.0903 -2.41649,0.97138 -5.37098,1.42987 -9.47171,1.39434 -4.10073,-0.0355 -9.57461,-0.97337 -15.70205,-2.53031 -6.12745,-1.55695 -12.96447,-3.88189 -17.64713,-5.78891 -4.68265,-1.90701 -7.34071,-3.17692 -9.999202,-4.44703'
  }
  iconParts.AT_SKKM_VEHICLE_AIRCRAFT_FIXED = {
    type: 'path',
    fill: false,
    stroke: '#0000FF',
    d: 'M 100,60 L 100,135'
  }
  iconParts.AT_SKKM_VEHICLE_AIRCRAFT_ROTARY = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#0000FF',
    d: 'M 100,100 L 100,135 M 70,135 L 130,135'
  }
  iconParts.AT_SKKM_EQUIPMENT_LARGE_SCALE = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#0000FF',
    d: 'M 60,145 L 60,55 M 45,55 155,55 M 140,55 140,145 M 155,145, 45,145'
  }
  iconParts.AT_SKKM_TEXT_G_TRIANGLE = {
    type: 'text',
    text: 'G',
    stroke: '#FF0000',
    x: 80,
    y: 130,
    fontsize: 50,
    fontfamily: 'Arial',
    textanchor: 'start'
  }
  iconParts.AT_SKKM_TEXT_C_TRIANGLE = {
    type: 'text',
    text: 'C',
    stroke: '#FF0000',
    x: 80,
    y: 130,
    fontsize: 50,
    fontfamily: 'Arial',
    textanchor: 'start'
  }
  iconParts.AT_SKKM_TEXT_EX_TRIANGLE = {
    type: 'text',
    text: 'EX',
    stroke: '#FF0000',
    x: 72,
    y: 140,
    fontsize: 40,
    fontfamily: 'Arial',
    textanchor: 'start'
  }
  iconParts.AT_SKKM_TEXT_G = {
    type: 'text',
    text: 'G',
    stroke: '#FF0000',
    x: 80,
    y: 120,
    fontsize: 50,
    fontfamily: 'Arial',
    textanchor: 'start'
  }
  iconParts.AT_SKKM_TEXT_C = {
    type: 'text',
    text: 'C',
    stroke: '#FF0000',
    x: 80,
    y: 120,
    fontsize: 50,
    fontfamily: 'Arial',
    textanchor: 'start'
  }
  iconParts.AT_OTHER_CULTURAL_FRAME_LARGE = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#0000FF',
    d: 'M 40,30 40,110 100,155 160,110 160,30 40,30'
  }
  iconParts.AT_OTHER_CULTURAL_INSIDE_ABOVE_LARGE = {
    type: 'path',
    fill: '#0000FF',
    stroke: '#0000FF',
    d: 'M 40,30 100,75 158,30 40,30'
  }
  iconParts.AT_OTHER_CULTURAL_INSIDE_BOTTOM_LARGE = {
    type: 'path',
    fill: '#0000FF',
    stroke: '#0000FF',
    d: 'M 40,110 100,75 158,110 100,155 40,110'
  }
  iconParts.AT_OTHER_CULTURAL_FRAME_SMALL = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#0000FF',
    d: 'M 40,50 40,80 60,100 80,80 80,50 40,50'
  }
  iconParts.AT_OTHER_CULTURAL_INSIDE_ABOVE_SMALL = {
    type: 'path',
    fill: '#0000FF',
    stroke: '#0000FF',
    d: 'M 40,50 60,70 77,54 40,50'
  }
  iconParts.AT_OTHER_CULTURAL_INSIDE_BOTTOM_SMALL = {
    type: 'path',
    fill: '#0000FF',
    stroke: '#0000FF',
    d: 'M 40,80 60,100 77,80 60,70 40,80'
  }
  iconParts.AT_OTHER_RED_CROSS = {
    type: 'path',
    fill: '#FF0000',
    stroke: '#FF0000',
    d: 'M 85,55 115,55 115,85 145,85 145,115 115,115 115,145 85,145 85,115 55,115 55,85 85,85 85,55'
  }
  iconParts.AT_OTHER_RED_CRYSTAL = {
    type: 'path',
    fill: '#FF0000',
    stroke: '#FF0000',
    d: 'M 100,50 150,100 100,150 50,100 100,50'
  }
  iconParts.AT_OTHER_WHITE_CRYSTAL = {
    type: 'path',
    fill: FILL_WHITE,
    stroke: '#FF0000',
    d: 'M 100,70 130,100 100,130 70,100 100,70'
  }
  iconParts.AT_OTHER_SAFTY_ZONES = {
    type: 'path',
    fill: '#FF0000',
    stroke: '#FF0000',
    d: 'M 25,145 25,150 30,150 180,50 180,45 175,45 25,145'
  }
  iconParts.AT_OTHER_CIVIL_DEFENCE_RECTANGLE_ORANGE = {
    type: 'path',
    fill: '#ffa500',
    stroke: '#ffa500',
    d: 'M 20,45 L 180,45 L 180,155 L 20,155 Z'
  }
  iconParts.AT_OTHER_CIVIL_DEFENCE_TRIANGLE_BLUE = {
    type: 'path',
    fill: '#0000FF',
    stroke: '#0000FF',
    d: 'M 100,70 130,130 70,130 100,70'
  }
}

export const skkmSIDCIcons = function (existingSIDCs, bbox, iconParts) {
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
    iconParts.AT_SKKM_RHOMBUS_BLUE
  ]
  // person/commander
  sidc['K-G-PC----'] = [
    iconParts.AT_SKKM_RHOMBUS_BLUE,
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
  // permanent/fixed facility
  sidc['K-G-FI----'] = [
    iconParts.AT_SKKM_HOUSE
  ]
  // temporary facility
  sidc['K-G-FS----'] = [
    iconParts.AT_SKKM_CIRCLE_BLUE
  ]
  // vehicle
  sidc['K-G-VM----'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_SKKM_VEHICLE_MOTOR
  ]
  // trailer
  sidc['K-G-VT----'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_SKKM_VEHICLE_TRAILER
  ]
  sidc['K-G-VL----'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_SKKM_VEHICLE_RAIL
  ]
  sidc['K-G-VS----'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_SKKM_VEHICLE_WATERCRAFT
  ]
  sidc['K-G-VF----'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_SKKM_VEHICLE_AIRCRAFT,
    iconParts.AT_SKKM_VEHICLE_AIRCRAFT_FIXED
  ]
  sidc['K-G-VR----'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_SKKM_VEHICLE_AIRCRAFT,
    iconParts.AT_SKKM_VEHICLE_AIRCRAFT_ROTARY
  ]
  sidc['K-G-E-----'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_SKKM_EQUIPMENT_LARGE_SCALE
  ]
  sidc['K-G-CH----'] = [
    iconParts.AT_OTHER_CULTURAL_FRAME_LARGE,
    iconParts.AT_OTHER_CULTURAL_INSIDE_ABOVE_LARGE,
    iconParts.AT_OTHER_CULTURAL_INSIDE_BOTTOM_LARGE
  ]
  sidc['K-G-CHSP--'] = [
    iconParts.AT_OTHER_CULTURAL_FRAME_SMALL,
    { type: 'translate', x: 90, y: 0, draw: [iconParts.AT_OTHER_CULTURAL_FRAME_SMALL] },
    { type: 'translate', x: 42, y: 50, draw: [iconParts.AT_OTHER_CULTURAL_FRAME_SMALL] },
    iconParts.AT_OTHER_CULTURAL_INSIDE_ABOVE_SMALL,
    { type: 'translate', x: 90, y: 0, draw: [iconParts.AT_OTHER_CULTURAL_INSIDE_ABOVE_SMALL] },
    { type: 'translate', x: 42, y: 50, draw: [iconParts.AT_OTHER_CULTURAL_INSIDE_ABOVE_SMALL] },
    iconParts.AT_OTHER_CULTURAL_INSIDE_BOTTOM_SMALL,
    { type: 'translate', x: 90, y: 0, draw: [iconParts.AT_OTHER_CULTURAL_INSIDE_BOTTOM_SMALL] },
    { type: 'translate', x: 42, y: 50, draw: [iconParts.AT_OTHER_CULTURAL_INSIDE_BOTTOM_SMALL] }
  ]
  sidc['K-G-DI----'] = [
    iconParts.AT_SKKM_TRIANGLE,
    iconParts.AT_SKKM_CIRCLE_TRIANGLE,
    { type: 'translate', x: -10, y: 15, draw: [iconParts.AT_SKKM_CIRCLE_TRIANGLE] },
    { type: 'translate', x: 10, y: 15, draw: [iconParts.AT_SKKM_CIRCLE_TRIANGLE] }
  ]
  sidc['K-G-RCRO--'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_OTHER_RED_CROSS
  ]
  sidc['K-G-RCRY--'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_OTHER_RED_CRYSTAL,
    iconParts.AT_OTHER_WHITE_CRYSTAL
  ]
  sidc['K-G-MHSZ--'] = [
    iconParts.AT_SKKM_RECTANGLE_WHITE,
    iconParts.AT_OTHER_SAFTY_ZONES
  ]
  sidc['K-G-CD----'] = [
    iconParts.AT_OTHER_CIVIL_DEFENCE_RECTANGLE_ORANGE,
    iconParts.AT_OTHER_CIVIL_DEFENCE_TRIANGLE_BLUE
  ]

  for (const [key, value] of Object.entries(sidc)) {
    bbox[key] = { x1: 0, y1: 0, x2: 200, y2: 155 }
    existingSIDCs[key] = value
  }
}

export const skkmLabels = function (sidc) {

  const incidentLabels = {
    dtg: { stroke: false, textanchor: 'end', x: 25, y: 80, fontsize: 40 },
    speed: { stroke: false, textanchor: 'end', x: 25, y: 155, fontsize: 40 },
    uniqueDesignation: { stroke: false, textanchor: 'end', x: 25, y: 120, fontsize: 40 },
    additionalInformation: { stroke: false, textanchor: 'start', x: 180, y: 155, fontsize: 40 }
  }

  const personLabels = {
    dtg: { stroke: false, textanchor: 'end', x: 25, y: 80, fontsize: 40 },
    speed: { stroke: false, textanchor: 'end', x: 25, y: 155, fontsize: 40 },
    uniqueDesignation: { stroke: false, textanchor: 'end', x: 25, y: 120, fontsize: 40 },
    additionalInformation: { stroke: false, textanchor: 'start', x: 180, y: 155, fontsize: 40 },
    higherFormation: { stroke: false, textanchor: 'start', x: 180, y: 120, fontsize: 40 },
    echelon: { stroke: false, textanchor: 'start', x: 0, y: -40, fontsize: 40 }
  }

  const unitEquipmentLabels = {
    dtg: { stroke: false, textanchor: 'end', x: 5, y: 80, fontsize: 40 },
    uniqueDesignation: { stroke: false, textanchor: 'end', x: 5, y: 120, fontsize: 40 },
    speed: { stroke: false, textanchor: 'end', x: 5, y: 155, fontsize: 40 },
    specialHeadquarters: { stroke: false, textanchor: 'center', x: 100, y: 140, fontsize: 40 },
    additionalInformation: { stroke: false, textanchor: 'start', x: 195, y: 155, fontsize: 40 },
    higherFormation: { stroke: false, textanchor: 'start', x: 195, y: 120, fontsize: 40 }
  }

  const facilityLabels = {
    dtg: { stroke: false, textanchor: 'end', x: 5, y: 80, fontsize: 40 },
    uniqueDesignation: { stroke: false, textanchor: 'end', x: 5, y: 120, fontsize: 40 },
    additionalInformation: { stroke: false, textanchor: 'start', x: 195, y: 155, fontsize: 40 },
    higherFormation: { stroke: false, textanchor: 'start', x: 195, y: 120, fontsize: 40 }
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
    'K-G-HFC---',
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
  // formationSIDCs.forEach(code => { sidc[code] = unitEquipmentLabels })
  facilitySIDCs.forEach(code => { sidc[code] = facilityLabels })
  equipmentSIDCs.forEach(code => { sidc[code] = unitEquipmentLabels })
}
