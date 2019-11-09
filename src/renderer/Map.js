import PropTypes from 'prop-types'

export const propTypes = {
  classes: PropTypes.any.isRequired,
  viewport: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  viewportChanged: PropTypes.func.isRequired
}

export const styles = {
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10
  }
}
