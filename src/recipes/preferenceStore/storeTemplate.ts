import type { TagNode, Internals } from '../types'
import type { TagPredicate } from '../../tagSelector'

import { parseTagSelector } from '../../tagSelector'


export const defaultSeparator = { sep: ';' }
export const innerSeparator = { sep: '=', trim: true, max: 2 }

export class PreferenceStore<T> {
    /**
     * Values can be stored in a preference store
     * Tags can inquire against value stores if they provide
     * 1. the storeId, and
     * 2. their identification, typically (key, num, fullOccur)
     *
     * Values cannot be updated, only overwritten
     * You would save settings regarding a specific tag in here,
     * not make a shared value, for that see `SharedStore` (TODO)
     */

    predicates: [TagPredicate, T][]
    defaultValue: T

    constructor(defaultValue: T) {
        this.defaultValue = defaultValue
        this.predicates = []
    }

    protected set(selector: string, value: T): void {
        this.predicates.unshift([parseTagSelector(selector), value])
    }

    get(key: string, num: number, fullOccur: number): T {
        for (const [predicate, value] of this.predicates) {
            if (predicate(key, num, fullOccur)) {
                return value
            }
        }

        return this.defaultValue
    }
}

export const storeTemplate = <Store extends PreferenceStore<U>, U>(
    Store: new (u: U) => Store,
) => (
    storeId: string,
    defaultValue: U,
    operation: (...vals: string[]) => (a: Store) => void,
) => <T extends Record<string, unknown>>(tag: TagNode, { cache }: Internals<T>) => {
    const commands = tag.values

    commands.forEach((cmd: string) => {
        cache.over(storeId, operation(...cmd), new Store(defaultValue))
    })

    return { ready: true }
}
