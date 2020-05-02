import React from 'react'
import { Typography } from '@material-ui/core'

import { useTranslation } from 'react-i18next'

const XYZOptions = props => {
  const { t } = useTranslation()
  return (<Typography>{t('basemapManagement.xyzNoOptions')}</Typography>)
}

export default XYZOptions
