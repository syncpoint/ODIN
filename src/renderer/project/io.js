import { remote } from 'electron'
import path from 'path'
import fs from 'fs'
import { noop, K } from '../../shared/combinators'

const projectPath = () => remote.getCurrentWindow().path

/**
 * Load preferences for open project.
 */
export const loadPreferences = defaults => {
  const location = path.join(projectPath(), 'preferences.json')
  if (!fs.existsSync(location)) return defaults

  return K(JSON.parse(fs.readFileSync(location)))(preferences => {

    // Upgrade existing preferences:
    //    activeLayer :: string [name of active aka target layer]
    if (!preferences.activeLayer) {
      const name = 'Default Layer' // TODO: i18n
      preferences.activeLayer = name
      const contents = '{"type":"FeatureCollection","features":[]}'
      writeLayer(name, contents)
    }
  })
}

/**
 * Update in-memory preferences and sync to file.
 * @param {object} args partial preference values
 */
export const writePreferences = preferences => {
  const location = path.join(projectPath(), 'preferences.json')
  fs.writeFileSync(location, JSON.stringify(preferences, null, 2))
}

/**
 * layerPath :: string -> string
 */
const layerPath =
  name =>
    path.join(projectPath(), 'layers', `${name}.json`)

/**
 * layerFilenames :: () -> [string]
 * Read (absolute) layer file names from open project.
 */
const layerFilenames = () => {
  const dir = path.join(projectPath(), 'layers')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(filename => filename.endsWith('.json'))
    .map(filename => path.join(dir, filename))
}

export const renameLayer =
  (prevName, nextName) =>
    fs.renameSync(layerPath(prevName), layerPath(nextName))

export const readLayer =
  name =>
    fs.readFileSync(layerPath(name), 'utf8')

export const loadLayers = () =>
  layerFilenames()
    .map(filename => path.basename(filename, '.json'))
    .map(name => ({ name, contents: readLayer(name) }))

export const writeLayer =
  (name, contents) =>
    fs.writeFileSync(layerPath(name), contents)

export const deleteLayer =
  name =>
    fs.unlink(layerPath(name), noop)
