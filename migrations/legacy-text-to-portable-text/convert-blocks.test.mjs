import assert from 'node:assert/strict'
import {test} from 'node:test'
import {convertBlocks} from './convert-blocks.mjs'

test('converts text and lists in order without changing images or rich text', () => {
  const image = {
    _type: 'imageBlock',
    _key: 'image',
    image: {asset: {_ref: 'asset'}, alt: 'Study', crop: {top: 0.2}},
    caption: 'Caption',
  }
  const rich = {
    _type: 'block',
    _key: 'rich',
    children: [{_type: 'span', text: 'Already rich', marks: ['strong']}],
    markDefs: [],
  }
  const original = [
    {_type: 'headingBlock', _key: 'heading', text: 'Heading'},
    {_type: 'paragraphBlock', _key: 'paragraph', text: '**Literal** text\nnext line'},
    image,
    {_type: 'listBlock', _key: 'list', items: ['First', 'Second']},
    rich,
    {_type: 'paragraphBlock', _key: 'empty', text: ''},
  ]
  const before = globalThis.structuredClone(original)
  const converted = convertBlocks(original)
  assert.deepEqual(original, before)
  assert.deepEqual(
    converted.map((block) => block._key),
    ['heading', 'paragraph', 'image', 'list', 'list-item-2', 'rich', 'empty'],
  )
  assert.equal(converted[0].style, 'h2')
  assert.equal(converted[1].style, 'normal')
  assert.equal(converted[1].children[0].text, '**Literal** text\nnext line')
  assert.equal(converted[2], image)
  assert.equal(converted[5], rich)
  assert.equal(converted[6].children[0].text, '')
  for (const block of converted.slice(3, 5)) {
    assert.equal(block.listItem, 'bullet')
    assert.equal(block.level, 1)
    assert.deepEqual(block.markDefs, [])
    assert.deepEqual(block.children[0].marks, [])
  }
  assert.deepEqual(
    converted.slice(3, 5).map((block) => block.children[0].text),
    ['First', 'Second'],
  )
  assert.equal(convertBlocks(converted), undefined)
})

test('list expansion avoids existing and generated key collisions deterministically', () => {
  const input = [
    {_type: 'listBlock', _key: 'list', items: ['First', 'Second', 'Third']},
    {_type: 'block', _key: 'list-item-2'},
    {_type: 'block', _key: 'list-item-2-1'},
  ]
  const output = convertBlocks(input)
  assert.equal(output[1]._key, 'list-item-2-2')
  assert.equal(new Set(output.map((block) => block._key)).size, output.length)
  assert.deepEqual(convertBlocks(input), output)
})

test('malformed legacy content fails instead of silently losing text', () => {
  for (const input of [
    null,
    [{_type: 'paragraphBlock', text: 'Missing key'}],
    [{_type: 'paragraphBlock', _key: 'text', text: null}],
    [{_type: 'listBlock', _key: 'list', items: []}],
    [{_type: 'listBlock', _key: 'list', items: ['First', null]}],
    [
      {_type: 'paragraphBlock', _key: 'same', text: 'Text'},
      {_type: 'imageBlock', _key: 'same'},
    ],
  ])
    assert.throws(() => convertBlocks(input))
})

test('already migrated and empty content produce no mutation', () => {
  assert.equal(convertBlocks([]), undefined)
  assert.equal(convertBlocks([{_type: 'block', _key: 'text'}]), undefined)
})
