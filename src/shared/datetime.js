import moment from 'moment'

export const currentDateTime = () =>
  moment.utc().format('DDHHmm[Z] MMM YY').toUpperCase()

export const fromNow = dtg => dtg && moment(dtg, 'DDHHmmZ MMM YYYY').fromNow()
