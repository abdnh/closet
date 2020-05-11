import type {
    FilterManager,
    FilterProcessor,
} from './filterManager'

import {
    calculateCoordinates,
} from './utils'

import type {
    TagInfo,
} from './tags'

import TemplateApi from './template'

import parseTemplate from './parser'

import {
    TAG_START,
    TAG_END,
    ARG_SEP,
} from './utils'

const MAX_ITERATIONS = 50

const renderTemplate = (text: string, filterManager: FilterManager): string => {
    let result = text
    let ready = false

    for (let i = 0; i < MAX_ITERATIONS && !ready; i++) {
        const rootTag = parseTemplate(result)
        const templateApi = new TemplateApi(rootTag)

        const [
            newText,
            finalOffset,
            innerReady,
        ] = postfixTraverse(text, rootTag, filterManager.filterProcessor({
            iteration: { index: i },
            template: templateApi,
        }))

        ready = innerReady
        result = newText

        filterManager.executeAndClearDeferred()
    }

        return result
}

const spliceSlice = (str: string, lend: number, rend: number, add: string = ''): string => {
    // We cannot pass negative lend directly to the 2nd slicing operation.
    const leftend = lend < 0
        ? Math.min(0, str.length + lend)
        : lend

    return str.slice(0, leftend) + add + str.slice(rend)
}

// try to make it more PDA
const postfixTraverse = (baseText: string, rootTag: TagInfo, filterProcessor: FilterProcessor): [string, number[], boolean]=> {
    const tagReduce = ([text, stack, ready]: [string, number[], boolean], tag: TagInfo): [string, number[], boolean] => {

        // going DOWN
        stack.push(stack[stack.length - 1])
        // console.info('going down', tag.data.path)

        const [
            modText,
            modStack,
            modReady,
        ] = tag.innerTags.reduce(tagReduce, [text, stack, true])

        // get offsets
        modStack.push(modStack.pop() - modStack[modStack.length - 1])

        const innerOffset = modStack.pop()
        const leftOffset = modStack.pop()
        console.info('pop time', tag.data.path, modStack, innerOffset, leftOffset)

        ///////////////////// Updating valuesRaw and values with innerTags
        const [
            lend,
            rend,
        ] = calculateCoordinates(tag.start, tag.end, leftOffset, innerOffset)

        const newValuesRaw = modText.slice(
            lend + (tag.naked ? 0 : TAG_START.length + tag.data.fullKey.length + ARG_SEP.length),
            rend - (tag.naked ? 0 : TAG_END.length),
        )

        const tagData = tag.data.shadowValuesRaw(newValuesRaw)
        console.log('data?', modText, tag.naked, tag.data.valuesRaw, newValuesRaw)

        ///////////////////// Evaluate current tag
        const filterOutput = filterProcessor(tagData, { ready: modReady })
        const newOffset = filterOutput.ready
            ? filterOutput.result.length - (tag.end - tag.start)
            : 0

        const newText = filterOutput.ready
            ? spliceSlice(modText, lend, rend, filterOutput.result)
            : modText

        // going UP
        const sum = innerOffset + leftOffset + newOffset
        modStack.push(sum)
        console.info('going up', tag.data.path, modText, '+++', filterOutput.result, '===', newText, modStack)

        return [
            newText,
            modStack,
            // ready means everything to the left is ready
            // filterOutput.ready means everything within and themselves are ready
            ready && filterOutput.ready
        ]
    }

    return tagReduce([baseText, [0,0], true], rootTag)
}

export default renderTemplate
