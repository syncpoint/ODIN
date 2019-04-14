const moment = require('moment')

const currentDateTime = () => moment.utc().format('DDHHmm[Z] MMM YY').toUpperCase()

module.exports = {
  currentDateTime
}
