import moment from 'moment'

export const currentDateTime = () => moment.utc().format('DDHHmm[Z] MMM YY').toUpperCase()