import type {
    FilterApi,
    FilterResult,
    Internals,
} from './types'

import type {
    Tag,
} from '../../types'

import {
    TAG_START,
    TAG_END,
    ARG_SEP,
} from '../../types'

const defaultFilter = ({fullKey, valuesRaw}: Tag): FilterResult => ({
    result: valuesRaw === null
        ? `${TAG_START}${fullKey}${TAG_END}`
        : `${TAG_START}${fullKey}${ARG_SEP}${valuesRaw}${TAG_END}`,
    memoize: false,
})

const standardizeFilterResult = (input: string | FilterResult): FilterResult => {
    switch (typeof input) {
        case 'string': return {
            result: input,
            memoize: false,
        }

        // also includes null
        case 'object': return {
            result: input.result ?? '',
            memoize: input.memoize ?? false,
        }
    }

    // return undefined otherwise
}

export const executeFilter = (filters, name, data: Tag, internals: Internals): FilterResult => {
    if (filters.has(name)) {
        const filter = filters.get(name)
        const result = standardizeFilterResult(filter(data, internals)) ?? defaultFilter(data)

        return result
    }

    else {
        return defaultFilter(data)
    }
}

export const mkFilterApi = (filters: Map<string, (Tag, Internals) => FilterResult | string>): FilterApi => {
    const registerFilter = (name, filter) => {
        filters.set(name, filter)
    }

    const hasFilter = (name) => filters.has(name)

    const unregisterFilter = (name) => {
        filters.delete(name)
    }

    const clearFilters = () => {
        filters.clear()
    }

    return {
        register: registerFilter,
        has: hasFilter,
        unregister: unregisterFilter,
        clear: clearFilters,
    }
}
