module.exports = function idify (name) {
  return !name ? name : name.split(' ').join('')
}
