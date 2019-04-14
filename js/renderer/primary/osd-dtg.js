const { currentDateTime } = require('../common/datetime')

const init = () => {
  const dtg = document.getElementsByClassName('odin-osd-dtg')[0]
  dtg.innerHTML = currentDateTime()
  setInterval(() => (dtg.innerHTML = currentDateTime()), 1000)
}

module.exports = {
  init
}
