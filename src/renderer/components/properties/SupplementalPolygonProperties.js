import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import FormLabel from '@material-ui/core/FormLabel'
import Checkbox from '@material-ui/core/Checkbox'
import debounce from 'lodash.debounce'
import PopoverPicker from './PopoverPicker'
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

const SupplementalLineProperties = props => {
  const classes = useStyles()
  const [properties, setProperties] = React.useState(props.getProperties())

  const color = () => properties.color || '#000000'
  const background = () => properties.background || false
  const backgroundColor = () => properties.backgroundColor || '#fefefe'

  const set = property => value => {
    const kv = {}
    kv[property] = value
    const state = { ...properties, ...kv }
    setProperties(state)
    props.update(kv)
  }

  const setChecked = property => event => {
    const value = event.target.checked
    const kv = {}
    kv[property] = value
    const state = { ...properties, ...kv }
    setProperties(state)
    props.update(kv)
  }

  const setColor = property => debounce(set(property), 200)

  return (
    <>
      <TextProperty label='Name' property='name' properties={properties} onCommit={props.update} className={classes.twoColumns}/>
      <div className={classes.styleProperties}>
        <FormLabel style={{ gridRow: 1, gridColumn: '2' }}>Color</FormLabel>
        <PopoverPicker style={{ gridRow: 1, gridColumn: '3' }} color={color()} onChange={setColor('color')} />
        <Checkbox style={{ gridRow: 2, gridColumn: '1' }} checked={background()} onChange={setChecked('background')}></Checkbox>
        <FormLabel style={{ gridRow: 2, gridColumn: '2' }}>Background</FormLabel>
        <PopoverPicker style={{ gridRow: 2, gridColumn: '3' }} color={backgroundColor()} onChange={setColor('backgroundColor')} />
      </div>
    </>
  )
}

SupplementalLineProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}

export default SupplementalLineProperties
