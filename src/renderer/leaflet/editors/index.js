import { corridorNPointEditor } from './CorridorNPoint'
import { editor } from './Generic'
import * as Shapes from './Shapes'

export const editors = {}
editors['generic'] = editor(Shapes.noShape)
editors['2pt-corridor'] = editor(Shapes.corridor2PointShape)
editors['orbit'] = editor(Shapes.orbitShape)
editors['fan'] = editor(Shapes.fanShape)
editors['arc'] = editor(Shapes.arcShape)
editors['npt-corridor'] = corridorNPointEditor(Shapes.corridorNPointShape)
