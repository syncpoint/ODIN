import React from 'react'
import { PropTypes } from 'prop-types'
import { Table, TableBody, TableCell, TableRow, TablePagination, Paper } from '@material-ui/core'

const WMTSLayerTable = props => {
  const PAGE_SIZE = 5

  const { layers, selectedLayerIdentifier, onLayerSelected } = props
  const [pageIndex, setPageIndex] = React.useState(selectedLayerIdentifier
    ? Math.floor(layers.findIndex(layer => layer.Identifier === selectedLayerIdentifier) / PAGE_SIZE)
    : 0
  )

  const handleChangePage = (_, nextPageIndex) => {
    setPageIndex(nextPageIndex)
  }

  if (!layers) return null

  return (
    <div>
      <Paper variant="outlined" style={{ marginTop: '1em' }}>
        <Table size="small">
          <TableBody>
            {
              layers
                .filter((_, index) => (index >= pageIndex * PAGE_SIZE && index < (pageIndex + 1) * PAGE_SIZE))
                .map(layer => (
                  <TableRow key={layer.Identifier} hover={true}
                    selected={selectedLayerIdentifier && selectedLayerIdentifier === layer.Identifier}
                    onClick={() => onLayerSelected(layer.Identifier)}
                  >
                    <TableCell>{layer.Title}</TableCell>
                    <TableCell>{layer.Abstract}</TableCell>
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={layers.length}
          page={pageIndex}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[]}
          onChangePage={handleChangePage}
        />
      </Paper>

    </div>
  )
}
WMTSLayerTable.propTypes = {
  columns: PropTypes.array,
  layers: PropTypes.array,
  selectedLayerIdentifier: PropTypes.string,
  onLayerSelected: PropTypes.func
}

export default WMTSLayerTable
