import L from 'leaflet'
import { toLatLngs, toGeometry } from '../GeoJSON'
import { corridorGeometry } from './corridor-geometry'
import selection from '../../components/App.selection'
import { doublyLinkedList } from '../../../shared/lists'
import { K } from '../../../shared/combinators'

/**
 *
 */
L.TACGRP = L.TACGRP || {}
L.TACGRP.Corridor = L.Layer.extend({


  /**
   *
   */
  initialize (feature, options) {
    L.setOptions(this, options)
    this._setFeature(feature)
  },


  /**
   *
   */
  beforeAdd (map) {
    this._map = map
    this._renderer = map.getRenderer(this)
  },


  /**
   *
   */
  onAdd (/* map */) {

    // TODO: should layer mediate between renderer and shape,
    // TODO: or should renderer directly deal with shape.

    const shapeOptions = {
      interactive: this.options.interactive
    }

    this._renderer._initGroup(this)
    this._shape = this._shape(this._group, shapeOptions)
    this._project()
    this._renderer._addGroup(this)

    this.on('click', this._edit, this)
  },


  /**
   *
   */
  onRemove (/* map */) {
    this.off('click', this._edit, this)
    this._renderer._removeGroup(this)
    this._map.tools.dispose() // dispose editor/selection tool
  },


  /**
   * Project WGS84 geometry to pixel/layer coordinates.
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    this._shape.updateFrame({
      center: this._corridor.latlngs.map(layerPoint),
      envelope: this._corridor.envelope().map(pair => pair.map(layerPoint))
    })
  },


  /**
   * Required by L.Renderer, but NOOP since we handle shape state in layer.
   * NOTE: Called twice after map was panned, so implementation should be fast.
   */
  _update () {
  },

  /* eslint-disable */

  /**
   *
   */
  _edit () {
    if (selection.isSelected(this.urn)) return
    selection.select(this.urn)

    // FIXME: CONSTRUCTION SITE AHEAD:

    // ==> HANDLE MARKER LAYER GROUP

    const MAIN_HANDLE = 'MAIN'
    const MIDDLE_HANDLE = 'MIDDLE'

    L.Feature.Handles = L.LayerGroup.extend({


      /**
       *
       */
      addHandle (latlng, options) {
        const className = options.type === MAIN_HANDLE ? 'marker-icon' : 'marker-icon marker-icon-middle'
        const marker = new L.Marker(latlng, {
          draggable: true,
          icon: L.divIcon({ className })
        })

        marker.type = options.type
        this._registerListeners(marker, options)
        return marker.addTo(this)
      },


      /**
       *
       */
      removeHandle (handle) {
        this.removeLayer(handle)
      },


      /**
       * Used to upgrade a middle handle to a main handle.
       */
      updateHandleOptions (marker, options) {
        marker.type = MAIN_HANDLE
        L.DomUtil.removeClass(marker._icon, 'marker-icon-middle')
        this._registerListeners(marker, options)
      },


      /**
       *
       */
      _registerListeners (marker, options) {
        ;['click', 'mousedown', 'dragstart', 'drag', 'dragend'].forEach(event => marker.off(event))

        marker.on('click', () => {}) // must not bubble up to map.
        if (options.mousedown) marker.on('mousedown', options.mousedown)

        // Disable click event on map while dragging:
        marker.on('dragstart', ({ target }) => target._map.tools.disableMapClick())
        marker.on('drag', options.drag)
        marker.on('dragend', event => {
          const { target } = event
          target._map.tools.enableMapClick()
          options.dragend && options.dragend(event)
        })

        return marker
      }
    })

    // <== HANDLE MARKER LAYER GROUP

    const callback = (channel, latlngs, width) => {

      // TODO: find better event names (editor abstraction).
      switch (channel) {
        case 'drag': {
          this._corridor = corridorGeometry(latlngs, width)
          return this._project()
        }
        case 'dragend': {
          const geometry = toGeometry('LineString', latlngs)
          geometry.width = width
          return this.options.update({ geometry })
        }
      }
    }

    // ==> FEATURE-SPECIFIC EDITOR

    // --> CONTEXT-FREE FUNCTIONS

    const midpoint = (a, b) => L.LatLng.midpoint([a.getLatLng(), b.getLatLng()])

    const latlngs = handles => handles
      .filter(handle => handle.type === MAIN_HANDLE)
      .map(handle => handle.getLatLng())


    // Add middle handles before and after new main handle:
    const insertMiddleHandles = (handles, mainHandle) => {
      const succ = this._handleLayer.addHandle(midpoint(mainHandle, mainHandle.succ), handleOptions[MIDDLE_HANDLE])
      handles.append(succ, mainHandle)
      const pred = this._handleLayer.addHandle(midpoint(mainHandle, mainHandle.pred), handleOptions[MIDDLE_HANDLE])
      handles.prepend(pred, mainHandle)
    }

    const updateMiddleHandles = handles => handles
      .filter(handle => handle.type === MAIN_HANDLE)
      .map(mainHandle => [mainHandle, mainHandle.succ])
      .filter(([_, middleHandle]) => middleHandle)
      .map(([mainHandle, middleHandle]) => [middleHandle, midpoint(mainHandle, middleHandle.succ)])
      .forEach(([middleHandle, latlng]) => middleHandle.setLatLng(latlng))

    // -->

    this._handleLayer = new L.Feature.Handles().addTo(this._map)
    const handleList = doublyLinkedList()

    const handleOptions = {}
    handleOptions[MAIN_HANDLE] = {
      type: MAIN_HANDLE,
      mousedown: event => {
        const { target: handle, originalEvent } = event
        const pointCount = handleList.filter(handle => handle.type === MAIN_HANDLE).length
        if (pointCount === 2) return
        if (!originalEvent.ctrlKey) return

        ;[handle.succ ? handle.succ : handle.pred, handle].forEach(handle => {
          this._handleLayer.removeHandle(handle)
          handleList.remove(handle)
        })

        updateMiddleHandles(handleList)
        callback('dragend', latlngs(handleList), this._corridor.width)
      },
      drag: () => {
        updateMiddleHandles(handleList)
        callback('drag', latlngs(handleList), this._corridor.width)
      },
      dragend: () => callback('dragend', latlngs(handleList), this._corridor.width)
    }

    handleOptions[MIDDLE_HANDLE] = {
      type: MIDDLE_HANDLE,
      drag: ({ target }) => {
        this._handleLayer.updateHandleOptions(target, handleOptions[MAIN_HANDLE])
        insertMiddleHandles(handleList, target)
      }
    }

    // TODO: latlngs - part of editor interface
    this._corridor.latlngs
      .map(latlng => this._handleLayer.addHandle(latlng, handleOptions[MAIN_HANDLE]))
      .reduce((acc, handle) => K(acc)(acc => acc.append(handle)), handleList)

    // Add midpoint handles:
    handleList
      .filter(marker => marker.type === MAIN_HANDLE)
      .filter(marker => marker.succ)
      .map(main => [main, midpoint(main, main.succ)])
      .map(([main, latlng]) => [main, this._handleLayer.addHandle(latlng, handleOptions[MIDDLE_HANDLE])])
      .reduce((acc, [main, middle]) => K(acc)(acc => acc.append(middle, main)), handleList)

    // Markers for corridor width:
    const tip = this._corridor.envelope()[0]
    const width = handle => handle.getLatLng().distanceTo(handleList.head().getLatLng())
    const widthHandleOptions = {
      type: MAIN_HANDLE,
      drag: ({ target }) => callback('drag', latlngs(handleList), width(target)),
      dragend: ({ target }) => callback('dragend', latlngs(handleList), width(target))
    }

    this._handleLayer.addHandle(tip[0], widthHandleOptions)
    this._handleLayer.addHandle(tip[1], widthHandleOptions)

      // <== FEATURE-SPECIFIC EDITOR

    // const callback = ({ channel, latlngs, type }) => {
    //   const width = this._corridor.width
    //   switch (channel) {
    //     case 'drag': {
    //       this._corridor = corridorGeometry(latlngs, width)
    //       return this._project()
    //     }
    //     case 'dragend': {
    //       const geometry = toGeometry(type, latlngs)
    //       geometry.width = width
    //       return this.options.update({ geometry })
    //     }
    //   }
    // }

    // const geometry = toGeometry('LineString', this._corridor.latlngs)
    // this._markerGroup =
    //   new L.Feature.MarkerGroup(geometry, callback)
    //     .addTo(this._map)

    // /// --- 8>< ---

    const editor = {
      dispose: () => {
        this._map.removeLayer(this._handleLayer)
        delete this._handleLayer
        selection.isSelected(this.urn) && selection.deselect()
      }
    }

    this._map.tools.edit(editor)
  },

  _setFeature (feature) {
    const latlngs = toLatLngs(feature.geometry)
    this._corridor = corridorGeometry(latlngs, feature.geometry.width)
  },

  updateData (feature) {
    this._setFeature(feature)
    this._project()

    // FIXME: workaround because we don't want to store this._feature
    const geometry = toGeometry('LineString', this._corridor.latlngs)
    if (this._markerGroup) this._markerGroup.updateGeometry(geometry)
  }
})
