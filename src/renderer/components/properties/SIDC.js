export const Modifier = {
  decode: sidc => {
    switch (sidc[10]) {
      case '-': return { modifierHQ: false, modifierTF: false, modifierFD: false }
      case '*': return { modifierHQ: false, modifierTF: false, modifierFD: false }
      case 'F': return { modifierHQ: false, modifierTF: false, modifierFD: true }
      case 'E': return { modifierHQ: false, modifierTF: true, modifierFD: false }
      case 'G': return { modifierHQ: false, modifierTF: true, modifierFD: true }
      case 'A': return { modifierHQ: true, modifierTF: false, modifierFD: false }
      case 'C': return { modifierHQ: true, modifierTF: false, modifierFD: true }
      case 'B': return { modifierHQ: true, modifierTF: true, modifierFD: false }
      case 'D': return { modifierHQ: true, modifierTF: true, modifierFD: true }
    }
  },

  encode: state => {
    const { modifierHQ, modifierTF, modifierFD } = state
    if (!modifierHQ && !modifierTF && !modifierFD) return '*'
    else if (!modifierHQ && !modifierTF && modifierFD) return 'F'
    else if (!modifierHQ && modifierTF && !modifierFD) return 'E'
    else if (!modifierHQ && modifierTF && modifierFD) return 'G'
    else if (modifierHQ && !modifierTF && !modifierFD) return 'A'
    else if (modifierHQ && !modifierTF && modifierFD) return 'C'
    else if (modifierHQ && modifierTF && !modifierFD) return 'B'
    else if (modifierHQ && modifierTF && modifierFD) return 'D'
  }
}
