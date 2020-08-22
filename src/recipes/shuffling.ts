import type { TagData, Registrar, Internals } from './types'

import { Stylizer } from './stylizer'
import { sequencer } from './sequencer'
import { topUp } from './sortInStrategies'

export const shufflingRecipe = ({
    tagname = 'mix',
    stylizer = Stylizer.make(),
    sortInStrategy = topUp,
} = {}) => <T extends {}>(registrar: Registrar<T>) => {
    const shuffleFilter = (tag: TagData, internals: Internals<T>) => {
        const unitId = `${tag.fullKey}:${tag.fullOccur}`
        const sequenceId = tag.num ? tag.fullKey : unitId

        const maybeValues = sequencer(
            unitId,
            sequenceId,
            sortInStrategy,
            ({ values }: TagData, _interals: Internals<T>): string[] => values ?? [],
        )(tag, internals)

        if (maybeValues) {
            return stylizer.stylize(maybeValues)
        }
    }

    registrar.register(tagname, shuffleFilter, { separators: ['||'] })
}
