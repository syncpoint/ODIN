import React from 'react'
import PropTypes from 'prop-types'

import {
  Button,
  Card, CardContent,
  Stepper, Step, StepLabel, Typography
} from '@material-ui/core'

import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos'
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos'
import CloseIcon from '@material-ui/icons/Close'
import SaveIcon from '@material-ui/icons/Save'

import Url from './Url'
import XYZOptions from './XYZOptions'
import WMTSOptions from './WMTSOptions'
import Name from './Name'

const SourceDescriptorDetails = props => {
  const { classes, t, selectedDescriptor } = props
  const { onCancel, onSave, onVerify } = props

  /* Metadata are a shallow copy without the embedded 'options' object */
  const [metadata, setMetadata] = React.useState(selectedDescriptor ? { ...selectedDescriptor } : {})
  /* Options are required in order to create an instance of a OpenLayers source */
  const [options, setOptions] = React.useState(selectedDescriptor ? { ...selectedDescriptor.options } : {})

  const [stepIndex, setStepIndex] = React.useState(0)
  const [allowNextStep, setAllowNextStep] = React.useState(true)

  const nextStep = () => setStepIndex(stepIndex => stepIndex + 1)
  const previousStep = () => setStepIndex(stepIndex => stepIndex - 1)

  const mergeOptions = (key, value) => {
    if (typeof key === 'object') {
      const shadow = { ...options, ...key }
      setOptions(shadow)
    } else {
      const shadow = { ...options }
      shadow[key] = value
      setOptions(shadow)
    }
  }

  const mergeMetadata = (key, value) => {
    const shadow = { ...metadata }
    shadow[key] = value
    setMetadata(shadow)
  }

  const handleSaveButtonClick = () => {
    const descriptor = { ...metadata }
    descriptor.options = { ...options }
    /* call the parent's onSave function */
    onSave(descriptor)
  }

  const steps = [
    t('basemapManagement.stepUrl'),
    t('basemapManagement.stepOptions'),
    t('basemapManagement.stepPreview'),
    t('basemapManagement.stepFinalize')
  ]

  const Options = props => {
    switch (metadata.type) {
      case 'XYZ': return <XYZOptions options={props.options}/>
      case 'WMTS': return <WMTSOptions options={props.options}/>
      default: return <Typography>{t('basemapManagement.unknownSource')}</Typography>
    }
  }
  Options.propTypes = { options: PropTypes.object }

  const Verify = props => {
    const { metadata, options, onValidation } = props
    React.useEffect(() => {
      const descriptor = { ...metadata }
      descriptor.options = { ...options }
      onVerify(descriptor)
      // visual verification is done by the user and always returns true
      onValidation(true)
    })
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography>{t('basemapManagement.usePreview')}</Typography>
        </CardContent>
      </Card>)
  }
  Verify.propTypes = {
    metadata: PropTypes.object,
    options: PropTypes.object,
    onValidation: PropTypes.func
  }

  const getStepContent = index => {
    switch (index) {
      case 0:
        return <Url
          classes={classes}
          // eslint-disable-next-line react/prop-types
          url={options.url}
          onValidation={setAllowNextStep}
          onTypePrediction={predictedType => mergeMetadata('type', predictedType)}
          onUrlReady={url => mergeOptions('url', url)}
        />
      case 1:
      {
        // eslint-disable-next-line react/prop-types
        switch (metadata.type) {
          case 'XYZ': return <XYZOptions options={options} merge={mergeOptions}/>
          case 'WMTS': return <WMTSOptions options={options} merge={mergeOptions} onValidation={setAllowNextStep}/>
          default: return <div>UNKNOWN SOURCE TYPE</div>
        }
      }
      case 2:
        return <Verify
          metadata={metadata}
          options={options}
          onValidation={setAllowNextStep}
        />
      case 3:
        return <Name
          classes={classes}
          // eslint-disable-next-line react/prop-types
          name={metadata.name}
          onValidation={setAllowNextStep}
          onNameReady={name => mergeMetadata('name', name)}
        />
      default: return <div>UNKNOWN STEP</div>
    }
  }

  return (
    <>
      <div className={classes.actions}>
        <Button id="cancel" variant="contained"
          startIcon={<CloseIcon />}
          onClick={onCancel}
          className={classes.actionButton}
        >
          {t('basemapManagement.cancel')}
        </Button>
      </div>
      <div>
        <Stepper activeStep={stepIndex}>
          { steps.map(label => {
            return (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            )
          })
          }
        </Stepper>
      </div>
      <div>
        { getStepContent(stepIndex) }
        <div className={classes.actions}>
          { stepIndex < (steps.length - 1)
            ? (<Button id="nextStep" variant="contained" color="primary" className={classes.actionButton}
              endIcon={<ArrowForwardIosIcon />}
              onClick={nextStep}
              disabled={!allowNextStep}
            >
              {t('basemapManagement.nextStep')}
            </Button>)
            : (<Button id="save" variant="contained" color="primary" className={classes.actionButton}
              startIcon={<SaveIcon />}
              onClick={handleSaveButtonClick}
              disabled={!allowNextStep}
            >
              {t('basemapManagement.save')}
            </Button>)
          }
          <Button id="previousStep" variant="contained" className={classes.actionButton}
            startIcon={<ArrowBackIosIcon />}
            onClick={previousStep}
            disabled={stepIndex === 0}
          >
            {t('basemapManagement.previousStep')}
          </Button>
        </div>
      </div>
    </>
  )
}
SourceDescriptorDetails.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  selectedDescriptor: PropTypes.object,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  onVerify: PropTypes.func
}

export default SourceDescriptorDetails
