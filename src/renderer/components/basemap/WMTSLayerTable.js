import React from 'react'
import { PropTypes } from 'prop-types'
import { Table, TableBody, TableCell, TableRow, TableContainer, TableHead } from '@material-ui/core'
import Paper from '@material-ui/core/Paper'

const WMTSLayerTable = props => {
  const { layers } = props
  if (!layers) return null

  return (
    <TableContainer component="Paper">
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
              <TableRow hover key={layer.Identifier}>
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
WMTSLayerTable.propTypes = { layers: PropTypes.array }

export default WMTSLayerTable
