import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Checkbox from '@material-ui/core/Checkbox'
import FormLabel from '@material-ui/core/FormLabel'
import Slider from '@material-ui/core/Slider'
import TextProperty from './TextProperty'
import TextareaProperty from './TextareaProperty'
import PopoverPicker from './PopoverPicker'
import debounce from 'lodash.debounce'

import { useTranslation } from 'react-i18next'

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' },
  styleProperties: {
    display: 'grid',
    gridGap: '0.75em',
    gridTemplateColumns: '24px auto 48px 12px 48px 12px 48px',
    gridTemplateRows: 'repeat(8, 32px)',
    alignItems: 'center',
    marginTop: theme.spacing(2)
  }
}))

const SupplementalTextProperties = props => {
  const classes = useStyles()
  const { t } = useTranslation()
  const [properties, setProperties] = React.useState(props.getProperties())

  const textColor = () => properties.textColor || '#000000'
  const fontSize = () => properties.fontSize || 16
  const borderColor = () => properties.borderColor || '#000000'
  const background = () => properties.background || false
  const backgroundColor = () => properties.backgroundColor || '#fefefe'
  const outlineColor = () => properties.outlineColor || '#fefefe'
  const outline = () => properties.outline || false
  const outlineWidth = () => properties.outlineWidth || 2
  const border = () => properties.border || false
  const borderWidth = () => properties.borderWidth || 3
  const rotation = () => properties.rotation || 0

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

  const setValue = property => (_, value) => {
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
        <FormLabel style={{ gridRow: 1, gridColumn: '2' }}>{t('text.font')}</FormLabel>
        <PopoverPicker style={{ gridRow: 1, gridColumn: '3' }} color={textColor()} onChange={setColor('textColor')} />
        <Slider style={{ gridRow: 1, gridColumn: '5', gridColumnEnd: 8 }}
          value={fontSize()}
          getAriaValueText={fontSize}
          aria-labelledby="discrete-slider"
          valueLabelDisplay="auto"
          step={8}
          marks={[
            { value: 16, label: '16' },
            { value: 24, label: '24' },
            { value: 32, label: '32' },
            { value: 48, label: '48' },
            { value: 64, label: '64' }
          ]}
          min={16}
          max={64}
          onChange={setValue('fontSize')}
        />

        <Checkbox style={{ gridRow: 3, gridColumn: '1' }} checked={outline()} onChange={setChecked('outline')}></Checkbox>
        <FormLabel style={{ gridRow: 3, gridColumn: '2' }}>{t('text.outline')}</FormLabel>
        <PopoverPicker style={{ gridRow: 3, gridColumn: '3' }} color={outlineColor()} onChange={setColor('outlineColor')} />
        <Slider
          style={{ gridRow: 3, gridColumn: '5', gridColumnEnd: 8 }}
          value={outlineWidth()}
          step={2}
          marks={[
            { value: 2, label: 'S' },
            { value: 4, label: 'M' },
            { value: 6, label: 'L' }
          ]}
          min={2}
          max={6}
          onChange={setValue('outlineWidth')}
        />

        <Checkbox style={{ gridRow: 4, gridColumn: '1' }} checked={background()} onChange={setChecked('background')}></Checkbox>
        <FormLabel style={{ gridRow: 4, gridColumn: '2' }}>{t('text.background')}</FormLabel>
        <PopoverPicker style={{ gridRow: 4, gridColumn: '3' }} color={backgroundColor()} onChange={setColor('backgroundColor')} />

        <Checkbox style={{ gridRow: 5, gridColumn: '1' }} checked={border()} onChange={setChecked('border')}></Checkbox>
        <FormLabel style={{ gridRow: 5, gridColumn: '2' }}>{t('text.border')}</FormLabel>
        <PopoverPicker style={{ gridRow: 5, gridColumn: '3' }} color={borderColor()} onChange={setColor('borderColor')} />
        <Slider
          style={{ gridRow: 5, gridColumn: '5', gridColumnEnd: 8 }}
          value={borderWidth()}
          step={3}
          marks={[
            { value: 3, label: 'S' },
            { value: 6, label: 'M' },
            { value: 9, label: 'L' }
          ]}
          min={3}
          max={9}
          onChange={setValue('borderWidth')}
        />

        <FormLabel style={{ gridRow: 7, gridColumn: '2' }}>{t('text.rotation')}</FormLabel>
        <Slider style={{ gridRow: 7, gridColumn: '3', gridColumnEnd: 8 }}
          value={rotation()}
          getAriaValueText={rotation}
          aria-labelledby="discrete-slider"
          valueLabelDisplay="auto"
          step={15}
          marks={[
            { value: 0, label: '0°' },
            { value: 90, label: '90°' },
            { value: 180, label: '180°' },
            { value: 270, label: '270°' },
            { value: 360, label: '360°' }
          ]}
          min={0}
          max={360}
          onChange={setValue('rotation')}
        />
      </div>
    </>
  )
}

SupplementalTextProperties.propTypes = {
  getProperties: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}

export default SupplementalTextProperties
