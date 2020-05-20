export default {
  replace: (index, char) => s => s.substring(0, index) + char + s.substring(index + 1)
}
