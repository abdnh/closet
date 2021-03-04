import React from "react"
import { useAsync } from "react-use"

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import "@site/src/css/ExampleCompiled.css"

import { closet } from "closetjs"
import "@site/node_modules/closetjs/dist/closet.css"

const setupPattern = /^.*\}/gsu
const prepareSetupCode = (moduleCode: string): string => {
  const match = moduleCode.match(setupPattern)

  if (!match) {
    throw new Error(`Module has invalid formatting: ${moduleCode}`)
  }

  return match[0]
}

//     const setupCode = await Promise.all(example.setups
//       .map((setupName: string) => import(`!raw-loader!@site/src/setups/${setupName}/setup`))
//     )
//       .then(setups => setups.map(setup => setup["default"]))

const prepare = (text: string, setups: any[], context: Record<string, unknown>[]): string => {
  const filterManager = closet.FilterManager.make()

  for (const setup of setups) {
    setup.setup(closet, filterManager, context[0])
  }

  filterManager.switchPreset(context[0])

  const output = closet.template.Template
    .make(text)
    .render(filterManager)

  return output[0]
}

type ExampleCompiledProps = { text: string, setupNames: string[], presetName: string }

const ExampleCompiled = ({ text, setupNames, presetName }: ExampleCompiledProps) => {

  const setups = useAsync(async () => Promise.all(
    setupNames.map((name: string) => import(`@site/src/setups/${name}`))
  ), [setupNames])

  const context = useAsync(async () => import(`@site/src/contexts/${presetName}`), [presetName])

  const rendered = setups.value && context.value
    ? prepare(text, setups.value, context.value.values.map((ctxt) => ctxt.data))
    : "..."

  return setups.value && context.value
    ? (
      <Tabs
        defaultValue={context.value.defaultValue}
        values={context.value.values}
        lazy
      >
        {context.value.values.map(({ value }) => (
          <TabItem key={value} value={value}>
            <pre dangerouslySetInnerHTML={{ __html: rendered }}>
            </pre>
          </TabItem>
        ))}
      </Tabs>
    )
    : <></>
}


export default ExampleCompiled;
