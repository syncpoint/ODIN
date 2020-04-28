import React from 'react'
import { PropTypes } from 'prop-types'
import { useTable, usePagination } from 'react-table'
import { IconButton, Table, TableBody, TableCell, TableRow, TableContainer, TableHead, Typography } from '@material-ui/core'
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'
import FirstPageIcon from '@material-ui/icons/FirstPage'
import LastPageIcon from '@material-ui/icons/LastPage'

const WMTSLayerTable = props => {
  const { columns, layers, selectedLayerIdentifier, onLayerSelected } = props

  if (!layers) return null

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    /* required for pagination */
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex }
  } = useTable(
    { columns: columns, data: layers, initialState: { pageSize: 5 } }, usePagination
  )

  return (
    <div>
      <TableContainer >
        <Table {...getTableProps()}>
          <TableBody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row)
              return (
              // eslint-disable-next-line react/jsx-key
                <TableRow {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return (
                    // eslint-disable-next-line react/jsx-key
                      <TableCell {...cell.getCellProps()}>
                        <Typography variant='body2' >
                          {cell.render('Cell')}
                        </Typography>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <div>
        <IconButton disabled={!canNextPage} onClick={() => gotoPage(0)}>
          <FirstPageIcon />
        </IconButton>
        <IconButton disabled={!canPreviousPage} onClick={() => previousPage()}>
          <NavigateBeforeIcon />
        </IconButton>
        <Typography variant='button'>{pageIndex + 1} / {pageOptions.length}</Typography>
        <IconButton disabled={!canNextPage} onClick={() => nextPage()}>
          <NavigateNextIcon />
        </IconButton>
        <IconButton disabled={!canNextPage} onClick={() => gotoPage(pageCount - 1)}>
          <LastPageIcon />
        </IconButton>
      </div>
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
