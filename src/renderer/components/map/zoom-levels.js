
// see: https://wiki.openstreetmap.org/wiki/Zoom_levels

export const zoomLevels = {
  0: { tiles: 1, tileWidth: 360, meterPerPixel: 156412, scale: '1:500.000.000', areas: 'whole world' },
  1: { tiles: 4, tileWidth: 180, meterPerPixel: 78206, scale: '1:250.000.000' },
  2: { tiles: 16, tileWidth: 90, meterPerPixel: 39103, scale: '1:150.000.000', areas: 'subcontinental area' },
  3: { tiles: 64, tileWidth: 45, meterPerPixel: 19551, scale: '1:70.000.000', areas: 'largest country' },
  4: { tiles: 256, tileWidth: 22.5, meterPerPixel: 9776, scale: '1:35.000.000', areas: 'largest country' },
  5: { tiles: 1024, tileWidth: 11.25, meterPerPixel: 4888, scale: '1:15.000.000', areas: 'large African country' },
  6: { tiles: 4096, tileWidth: 5.625, meterPerPixel: 2444, scale: '1:10.000.000', areas: 'large European country' },
  7: { tiles: 16384, tileWidth: 2.813, meterPerPixel: 1222, scale: '1:4.000.000', areas: 'small country, US state' },
  8: { tiles: 65536, tileWidth: 1.406, meterPerPixel: 610.984, scale: '1:2.000.000' },
  9: { tiles: 262144, tileWidth: 0.703, meterPerPixel: 305.492, scale: '1:1.000.000', areas: 'wide area, large metropolitan area' },
  10: { tiles: 1048576, tileWidth: 0.352, meterPerPixel: 152.746, scale: '1:500.000', areas: 'metropolitan area' },
  11: { tiles: 4194304, tileWidth: 0.176, meterPerPixel: 76.373, scale: '1:250.000', areas: 'city' },
  12: { tiles: 16777216, tileWidth: 0.088, meterPerPixel: 38.187, scale: '1:150.000', areas: 'town, or city district' },
  13: { tiles: 67108864, tileWidth: 0.044, meterPerPixel: 19.093, scale: '1:70.000', areas: 'village, or suburb' },
  14: { tiles: 268435456, tileWidth: 0.022, meterPerPixel: 9.547, scale: '1:35.000' },
  15: { tiles: 1073741824, tileWidth: 0.011, meterPerPixel: 4.773, scale: '1:15.000', areas: 'small road' },
  16: { tiles: 4294967296, tileWidth: 0.005, meterPerPixel: 2.387, scale: '1:8.000', areas: 'street' },
  17: { tiles: 17179869184, tileWidth: 0.003, meterPerPixel: 1.193, scale: '1:4.000', areas: 'block, park, addresses' },
  18: { tiles: 68719476736, tileWidth: 0.001, meterPerPixel: 0.596, scale: '1:2.000', areas: 'some buildings, trees' },
  19: { tiles: 274877906944, tileWidth: 0.0005, meterPerPixel: 0.298, scale: '1:1.000', areas: 'local highway and crossing details' }
}
