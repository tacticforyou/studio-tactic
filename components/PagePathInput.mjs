// @ts-check
import {GenerateIcon} from '@sanity/icons/Generate'
import {Box, Button, Flex} from '@sanity/ui'
import {createElement} from 'react'
import {set, useFormValue} from 'sanity'
import {getMainPage} from '../structure/content-groups.mjs'
import {generateContentPath} from './page-path.mjs'

/** @param {import('sanity').StringInputProps} props */
export function PagePathInput(props) {
  const title = useFormValue(['title'])
  const kind = useFormValue(['kind'])
  const id = useFormValue(['_id'])
  const _id = typeof id === 'string' ? id : undefined
  const nextPath = generateContentPath({_id, title, kind})

  if (props.readOnly || getMainPage(_id)) return props.renderDefault(props)

  return createElement(
    Flex,
    {align: 'center', gap: 2},
    createElement(Box, {flex: 1, style: {minWidth: 0}}, props.renderDefault(props)),
    createElement(Button, {
      icon: GenerateIcon,
      text: 'Generate',
      mode: 'ghost',
      disabled: !nextPath || nextPath === props.value,
      onClick: () => {
        if (nextPath) props.onChange(set(nextPath))
      },
    }),
  )
}
