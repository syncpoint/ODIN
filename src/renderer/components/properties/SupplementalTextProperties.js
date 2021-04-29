import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Checkbox from '@material-ui/core/Checkbox'
import TextField from '@material-ui/core/TextField'
import FormLabel from '@material-ui/core/FormLabel'
import TextProperty from './TextProperty'
import TextareaProperty from './TextareaProperty'
import PopoverPicker from './PopoverPicker'
import debounce from 'lodash.debounce'

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

const SupplementalTextProperties = props => {
  const classes = useStyles()
  const [properties, setProperties] = React.useState(props.getProperties())

  const textColor = () => properties.textColor || '#000000'
  const fontSize = () => properties.fontSize || ''
  const padding = () => properties.padding || ''
  const borderColor = () => properties.borderColor || '#000000'
  const background = () => properties.background || false
  const backgroundColor = () => properties.backgroundColor || '#fefefe'
  const outlineColor = () => properties.outlineColor || '#fefefe'
  const outline = () => properties.outline || false
  const outlineWidth = () => properties.outlineWidth || ''
  const border = () => properties.border || false
  const borderWidth = () => properties.borderWidth || ''
  const rotation = () => properties.rotation || ''

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

  const setText = property => event => {
    const value = event.target.value
    const kv = {}
    kv[property] = value
    const state = { ...properties, ...kv }
    setProperties(state)
    props.update(kv)
  }

  const setColor = property => debounce(set(property), 200)

  return (
    <>
      <TextProperty label='Name' property='name' properties={props.getProperties()} onCommit={props.update} className={classes.twoColumns}/>
      <TextareaProperty label='Text' property='text' properties={props.getProperties()} onCommit={props.update} className={classes.twoColumns}/>
      <div className={classes.styleProperties}>
        <FormLabel style={{ gridRow: 1, gridColumn: '2' }}>Color</FormLabel>
        <PopoverPicker style={{ gridRow: 1, gridColumn: '3' }} color={textColor()} onChange={setColor('textColor')} />
        <Checkbox style={{ gridRow: 2, gridColumn: '1' }} checked={outline()} onChange={setChecked('outline')}></Checkbox>
        <FormLabel style={{ gridRow: 2, gridColumn: '2' }}>Outline</FormLabel>
        <PopoverPicker style={{ gridRow: 2, gridColumn: '3' }} color={outlineColor()} onChange={setColor('outlineColor')} />
        <TextField style={{ gridRow: 2, gridColumn: '5' }} value={outlineWidth()} onChange={setText('outlineWidth')}/>
        <Checkbox style={{ gridRow: 3, gridColumn: '1' }} checked={background()} onChange={setChecked('background')}></Checkbox>
        <FormLabel style={{ gridRow: 3, gridColumn: '2' }}>Background</FormLabel>
        <PopoverPicker style={{ gridRow: 3, gridColumn: '3' }} color={backgroundColor()} onChange={setColor('backgroundColor')} />
        <Checkbox style={{ gridRow: 4, gridColumn: '1' }} checked={border()} onChange={setChecked('border')}></Checkbox>
        <FormLabel style={{ gridRow: 4, gridColumn: '2' }}>Border</FormLabel>
        <PopoverPicker style={{ gridRow: 4, gridColumn: '3' }} color={borderColor()} onChange={setColor('borderColor')} />
        <TextField style={{ gridRow: 4, gridColumn: '5' }} value={borderWidth()} onChange={setText('borderWidth')}/>
        <FormLabel style={{ gridRow: 5, gridColumn: '2' }}>Padding</FormLabel>
        <TextField style={{ gridRow: 5, gridColumn: '3' }} value={padding()} onChange={setText('padding')}/>
        <FormLabel style={{ gridRow: 6, gridColumn: '2' }}>Size</FormLabel>
        <TextField style={{ gridRow: 6, gridColumn: '3' }} value={fontSize()} onChange={setText('fontSize')}/>
        <FormLabel style={{ gridRow: 7, gridColumn: '2' }}>Rotation</FormLabel>
        <TextField style={{ gridRow: 7, gridColumn: '3' }} value={rotation()} onChange={setText('rotation')}/>
      </div>
    </>
  )
}

SupplementalTextProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}

export default SupplementalTextProperties
