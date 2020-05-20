import React from 'react'
import { DndProvider } from 'react-dnd'
import Backend from 'react-dnd-html5-backend'
import BasemapList from './BasemapList'

const BasemapPanel = () => {

  return (
    <DndProvider backend={Backend}><BasemapList /></DndProvider>
  )
}

export default BasemapPanel
