const legacyTypes = new Set(['paragraphBlock', 'headingBlock', 'listBlock'])

/** @param {unknown} blocks */
export function convertBlocks(blocks) {
  if (!Array.isArray(blocks)) throw new Error('Page content must be an array')
  if (!blocks.some((block) => legacyTypes.has(block?._type))) return undefined

  const keys = new Set()
  for (const block of blocks) {
    if (!block || typeof block._key !== 'string' || !block._key || keys.has(block._key)) {
      throw new Error(
        'Page content has missing or duplicate block keys; repair it before migrating',
      )
    }
    keys.add(block._key)
  }

  return blocks.flatMap((block) => {
    if (!legacyTypes.has(block._type)) return [block]
    const {_type, text, items, ...rest} = block
    if (_type !== 'listBlock') {
      if (typeof text !== 'string') throw new Error(`Block ${block._key} has invalid text`)
      return [portableBlock(rest, text, _type === 'headingBlock' ? 'h2' : 'normal')]
    }
    if (!Array.isArray(items) || !items.length || items.some((item) => typeof item !== 'string')) {
      throw new Error(`List ${block._key} has invalid items; repair it before migrating`)
    }
    return items.map((item, index) => {
      let key = block._key
      if (index > 0) {
        const base = `${block._key}-item-${index + 1}`
        key = base
        let suffix = 1
        while (keys.has(key)) key = `${base}-${suffix++}`
        keys.add(key)
      }
      return {...portableBlock({...rest, _key: key}, item, 'normal'), listItem: 'bullet', level: 1}
    })
  })
}

/**
 * @param {Record<string, unknown>} fields
 * @param {string} text
 * @param {string} style
 */
function portableBlock(fields, text, style) {
  return {
    ...fields,
    _type: 'block',
    style,
    children: [{_type: 'span', _key: 'text', text, marks: []}],
    markDefs: [],
  }
}
