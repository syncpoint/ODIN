export const schemeToSliderValue = scheme => {
  switch (scheme) {
    case 'light': return 0
    case 'medium': return 50
    case 'dark': return 100
    default: return 50
  }
}

export const sliderValueToScheme = value => {
  if (value === 0) return 'light'
  else if (value === 50) return 'medium'
  else if (value === 100) return 'dark'
  else return 'medium'
}
