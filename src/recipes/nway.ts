import type { TagData, Filters, FilterPredicate, Internals, Recipe, WrapOptions } from './types'

export const twoWayWrap = <T extends object, U extends object>(
    predicate: FilterPredicate<T & U>,
    recipeFalse: Recipe<T>,
    recipeTrue: Recipe<U>, {
        setTagnames = (options, newNames) => options['tagname'] = newNames[0],
    }: WrapOptions = {},
): Recipe<T & U> => ({
    tagname,

    optionsFalse = {},
    optionsTrue = {},
}: {
    tagname: string,

    optionsTrue: object,
    optionsFalse: object,
}) => (filterApi: Filters<T & U>) => {
    const tagnameTrue = `${tagname}:twoWay:true`
    const tagnameFalse = `${tagname}:twoWay:false`

    setTagnames(optionsTrue, [tagnameTrue])
    setTagnames(optionsFalse, [tagnameFalse])

    recipeTrue(optionsTrue)(filterApi)
    recipeFalse(optionsFalse)(filterApi)

    const twoWayFilter = (
        tag: TagData,
        internals: Internals<T & U>,
    ) => {
        return predicate(tag, internals)
            ? internals.filters.get(tagnameTrue)(tag, internals)
            : internals.filters.get(tagnameFalse)(tag, internals)
    }

    filterApi.register(tagname, twoWayFilter)
}

export const fourWayWrap = <T extends object, U extends object, V extends object, W extends object>(
    predicateOne: FilterPredicate<T & U & V & W>,
    predicateTwo: FilterPredicate<T & U & V & W>,
    recipeZero: Recipe<T>,
    recipeOne: Recipe<U>,
    recipeTwo: Recipe<V>,
    recipeThree: Recipe<W>, {
        setTagnames = (options, newNames) => options['tagname'] = newNames[0],
    }: WrapOptions = {},
): Recipe<T & U & V & W> => ({
    tagname,

    optionsZero = {},
    optionsOne = {},
    optionsTwo = {},
    optionsThree = {},

}: {
    tagname: string,
    predicateOne: (t: TagData, inter: Internals<T & U & V & W>) => boolean,
    predicateTwo: (t: TagData, inter: Internals<T & U & V & W>) => boolean,

    optionsThree: object,
    optionsTwo: object,
    optionsOne: object,
    optionsZero: object,

    setTagname: (options: object, newName: string) => void,
}) => (filterApi: Filters<T & U & V & W>) => {
    const tagnameZero = `${tagname}:fourWay:zero`
    const tagnameTwo = `${tagname}:fourWay:two`

    setTagnames(optionsZero, [tagnameZero])
    setTagnames(optionsOne, [tagnameZero])

    twoWayWrap(predicateOne, recipeZero, recipeOne)({
        tagname: tagnameZero,

        optionsFalse: optionsZero,
        optionsTrue: optionsOne,
    })(filterApi)

    setTagnames(optionsTwo, [tagnameTwo])
    setTagnames(optionsThree, [tagnameTwo])

    twoWayWrap(predicateOne, recipeTwo, recipeThree)({
        tagname: tagnameTwo,

        optionsFalse: optionsTwo,
        optionsTrue: optionsThree,
    })(filterApi)

    const fourWayFilter = (
        tag: TagData,
        internals: Internals<T & U & V & W>,
    ) => {
        return predicateTwo(tag, internals)
            ? internals.filters.get(tagnameTwo)(tag, internals)
            : internals.filters.get(tagnameZero)(tag, internals)
    }

    filterApi.register(tagname, fourWayFilter)
}
