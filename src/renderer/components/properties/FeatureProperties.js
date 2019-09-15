import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import store from '../../stores/layer-store'

class FeatureProperties extends React.Component {
  constructor (props) {
    super(props)

    const { feature } = props
    this.state = this.extractState(feature)
  }

  updateField (name, value) {
    const { layerId, featureId } = this.props
    const state = R.clone(this.state)
    state[name] = value
    this.setState(state, () => {
      store.updateFeature(layerId)(featureId, this.feature())
    })
  }

  updateFields (entries) {
    const { layerId, featureId } = this.props
    const state = Object.entries(entries).reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, R.clone(this.state))

    this.setState(state, () => {
      store.updateFeature(layerId)(featureId, this.feature())
    })
  }
}

FeatureProperties.propTypes = {
  feature: PropTypes.any.isRequired,
  layerId: PropTypes.string.isRequired,
  featureId: PropTypes.string.isRequired
}

export default FeatureProperties
