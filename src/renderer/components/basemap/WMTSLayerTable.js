import React from 'react'
import { PropTypes } from 'prop-types'
import { Table, TableBody, TableCell, TableRow, TableContainer, TableHead } from '@material-ui/core'

const WMTSLayerTable = props => {
  const { layers, selectedLayerIdentifier, onLayerSelected } = props
  if (!layers) return null

  React.useEffect(() => {
    console.log('WMTSLayerTable mounted')
    return () => console.log('WMTSLayerTable unmounted')
  }, [])

  return (
    <TableContainer >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><b>Title</b></TableCell>
            <TableCell>Abstract</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            props.layers.map(layer => (
              <TableRow hover key={layer.Identifier} onClick={() => onLayerSelected(layer.Identifier)}
                selected={selectedLayerIdentifier === layer.Identifier}>
                <TableCell>{layer.Title}</TableCell>
                <TableCell>{layer.Abstract}</TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </TableContainer>
  )
}
WMTSLayerTable.propTypes = {
  layers: PropTypes.array,
  selectedLayerIdentifier: PropTypes.string,
  onLayerSelected: PropTypes.func
}

export default WMTSLayerTable
