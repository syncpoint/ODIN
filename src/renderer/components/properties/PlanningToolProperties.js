import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'

import TextProperty from './TextProperty'

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' },
  styleProperties: {
    display: 'grid',
    gridGap: '0.75em',
    gridTemplateColumns: '24px auto 48px 12px 48px 12px 48px',
    gridTemplateRows: 'repeat(8, 24px)',
    alignItems: 'center',
    marginTop: theme.spacing(2)
  }
}))

const PlanningToolProperties = props => {
  const classes = useStyles()
  const [properties] = React.useState(props.getProperties())

  return (
    <>
      <TextProperty label='Name' property='name' properties={properties} onCommit={props.update} className={classes.twoColumns}/>
      <div className={classes.styleProperties}>
      </div>
    </>
  )
}

PlanningToolProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}

export default PlanningToolProperties
