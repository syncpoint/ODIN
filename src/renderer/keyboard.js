import Mousetrap from 'mousetrap'
import preferences from './preferences'

const featuresPrefs = preferences.features()

Mousetrap.bind('a', () => featuresPrefs.toggle('all'))
Mousetrap.bind('l', () => featuresPrefs.toggle('labels'))
Mousetrap.bind('u', () => featuresPrefs.toggle('units'))
Mousetrap.bind('g', () => featuresPrefs.toggle('graphics'))
Mousetrap.bind('p', () => featuresPrefs.toggle('points'))
Mousetrap.bind('+', () => featuresPrefs.scaleUpSymbols())
Mousetrap.bind('-', () => featuresPrefs.scaleDownSymbols())
