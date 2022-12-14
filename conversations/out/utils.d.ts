/** Identity function */
export declare function ident<T>(arg: T): T;
/**
 * Performs a structured clone, ignoring non-enumerable properties such as
 * functions.
 */
export declare function clone<T>(arg: T): any;
export declare function IS_NOT_INTRINSIC(key: string): boolean;
/**
 * A resolver wraps a promise so that it can be resolved by an outside event. It
 * is a container for this promise which you can `await`, and a function
 * `resolve` which you can call. Once you call `resolve`, the contained promise
 * will resolve.
 *
 * The status flag `isResolved` indicates if `resolve` has been called or not.
 */
export interface Resolver<T> {
    /** The promise which can be resolved by calling `resolve` */
    promise: Promise<T>;
    /** Value of the promise, if is it resolved, and undefined otherwise */
    value?: T;
    /** Resolves the promise of this resolver */
    resolve(t?: T): void;
    /**
     * A flag indicating whether `resolve` has been called, i.e. whether the
     * promise has been resolved. Has the value `true` until `resolve` is
     * called.
     */
    isResolved(): this is {
        value: T;
    };
}
/** Creates a new resolver */
export declare function resolver<T>(value?: T): Resolver<T>;
