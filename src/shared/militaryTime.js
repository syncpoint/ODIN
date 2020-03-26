import { DateTime } from 'luxon'

const milTimeZones = {
  '+0': 'Z',
  '+1': 'A',
  '+2': 'B',
  '+3': 'C',
  '+4': 'D',
  '+5': 'E',
  '+6': 'F',
  '+7': 'G',
  '+8': 'H',
  '+9': 'I',
  '+10': 'K',
  '+11': 'L',
  '+12': 'M',
  '-1': 'N',
  '-2': 'O',
  '-3': 'P',
  '-4': 'Q',
  '-5': 'R',
  '-6': 'S',
  '-7': 'T',
  '-8': 'U',
  '-9': 'V',
  '-10': 'W',
  '-11': 'X',
  '-12': 'Y'
}

const MIL_DATE_FORMAT = 'ddHHmm--LLLyy'

/**
 *
 * @param {*} date a Luxon DateTime object
 */
const toMilitaryTime = date => {
  const offset = Math.floor(date.offset / 60)
  const offsetAsString = (offset >= 0) ? `+${offset}` : `-${offset}`
  return date.toFormat(MIL_DATE_FORMAT).toLowerCase().replace('--', milTimeZones[offsetAsString])
}

const getCurrentDateTime = () => {
  return toMilitaryTime(DateTime.local())
}

/**
 *
 * @param {*} isoDateString Military DateTime from an ISO 8601 string
 * @returns the military date format
 */
export const fromISO = isoDateString => {
  const date = DateTime.fromISO(isoDateString)
  return toMilitaryTime(date)
}

export default getCurrentDateTime
