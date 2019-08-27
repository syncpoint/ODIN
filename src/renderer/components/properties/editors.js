import { ResourceNames } from '../../model/resource-names'

const handlers = {} // nid => handler

const propertiesPane = urn => {
  const nid = ResourceNames.nid(urn)
  const handler = handlers[nid]
  return handler ? handler.propertiesPane(urn) : null
}


export const editors = {
  register: (nid, handler) => (handlers[nid] = handler),
  propertiesPane
}
