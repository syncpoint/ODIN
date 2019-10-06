import { editor } from './Generic'
import * as Shapes from './Shapes'

export const editors = {}
editors['generic'] = editor(Shapes.noShape)
editors['orbit'] = editor(Shapes.orbitShape)
editors['fan'] = editor(Shapes.fanShape)
editors['arc'] = editor(Shapes.arcShape)
