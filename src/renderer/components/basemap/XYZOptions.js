import React from 'react'
import { Card, CardContent, Typography } from '@material-ui/core'

import { useTranslation } from 'react-i18next'

const XYZOptions = props => {
  const { t } = useTranslation()
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography>{t('basemapManagement.xyzNoOptions')}</Typography>
      </CardContent>
    </Card>
  )
}

export default XYZOptions
