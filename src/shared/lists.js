/* eslint-disable no-return-assign */

const forEach = head => f => {
  let node = head
  do {
    node && f(node)
    if (node) node = node.succ
  } while (node && node !== head)
}

const filter = head => p => {
  const acc = []
  forEach(head)(node => p(node) && acc.push(node))
  return acc
}

const insertAfter = (pivot, node) => {
  node.pred = pivot
  node.succ = pivot.succ
  if (pivot.succ) pivot.succ.pred = node
  pivot.succ = node
}

const insertBefore = (pivot, node) => {
  node.pred = pivot.pred
  node.succ = pivot
  if (pivot.pred) pivot.pred.succ = node
  pivot.pred = node
}

export const doublyLinkedList = () => {
  let head
  let tail

  const append = (node, other) => {
    if (!tail) return head = tail = node
    if (other) return insertAfter(other, node)
    insertAfter(tail, node)
    tail = node
  }

  const prepend = (node, other) => {
    if (!head) return head = tail = node
    if (other) return insertBefore(other, node)
    insertBefore(head, node)
    head = node
  }

  const remove = node => {
    if (head === node) head = node.succ
    if (tail === node) tail = node.pred
    if (node.pred) node.pred.succ = node.succ
    if (node.succ) node.succ.pred = node.pred
    delete node.succ
    delete node.pred
  }

  return {
    append,
    prepend,
    remove,
    empty: () => !head,
    forEach: f => forEach(head)(f),
    filter: p => filter(head)(p),
    head: () => head
  }
}

export const circularDoublyLinkedList = () => {
  let head

  const append = (node, other) => {
    if (!head) head = node.succ = node.pred = node
    const pivot = other || head.pred
    insertAfter(pivot, node)
  }

  const prepend = (node, other) => {
    if (!head) head = node.succ = node.pred = node
    const pivot = other || head.succ
    insertBefore(pivot, node)
  }

  const remove = node => {
    if (head === node) {
      if (node.succ === node) head = null
      else head = node.succ
    }
    node.pred.succ = node.succ
    node.succ.pred = node.pred
    delete node.succ
    delete node.pred
  }

  return {
    append,
    prepend,
    remove,
    empty: () => !head,
    forEach: f => forEach(head)(f),
    filter: p => filter(head)(p)
  }
}
