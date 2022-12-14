import { type ApiResponse, Context, type Filter, type FilterQuery, type LazySessionFlavor, type MiddlewareFn, type RawApi, type SessionFlavor, type Update, type User } from "./deps.node.js";
import { ConversationForm } from "./form.js";
import { type Resolver } from "./utils.js";
/**
 * A user-defined builder function that can be turned into middleware for a
 * conversation.
 */
declare type ConversationBuilder<C extends Context> = (conversation: Conversation<C>, ctx: C) => unknown | Promise<unknown>;
/**
 * Context flavor for the conversations plugin. Adds the conversation control
 * panel `ctx.conversation` which e.g. allows entering a conversation. It also
 * adds some properties to the session which the conversation plugin needs.
 */
export declare type ConversationFlavor = {
    conversation: ConversationControls;
} & (SessionFlavor<ConversationSessionData> | LazySessionFlavor<ConversationSessionData>);
interface Internals {
    /** Known conversation identifiers, used for collision checking */
    ids: Set<string>;
}
/**
 * Used to store data invisibly on context object inside the conversation
 * control panel
 */
declare const internal: unique symbol;
/**
 * The is the conversation control panel which is available on
 * `ctx.conversation`. It allows you to enter and exit conversations, and to
 * inspect which conversation is currently active.
 */
declare class ConversationControls {
    private readonly session;
    /** List of all conversations to be started */
    readonly [internal]: Internals;
    constructor(session: () => Promise<ConversationSessionData>);
    /**
     * Returns a map of the identifiers of currently active conversations to the
     * number of times this conversation is active in the current chat. For
     * example, you can use `"captcha" in ctx.conversation.active` to check if
     * there are any active conversations in this chat with the identifier
     * `"captcha"`.
     */
    active(): Promise<{
        [k: string]: number;
    }>;
    /**
     * Enters a conversation with the given identifier.
     *
     * Note that this method is async. You must `await` this method.
     *
     * While it is possible to enter a conversation from within another
     * conversation in order to start a parallel conversation, it is usually
     * preferable to simply call the other conversation function directly:
     * https://grammy.dev/plugins/conversations.html#functions-and-recursion
     */
    enter(id: string, _opts?: {
        /**
         * Specify `true` if all running conversations in the same chat should
         * be terminated before entering this conversation. Defaults to `false`.
         */
        overwrite?: boolean;
    }): Promise<void>;
    /**
     * Kills all conversations with the given identifier (if any) and enters a
     * new conversation for this identifier. Equivalent to passing `overwrite:
     * true` to `enter`.
     *
     * Note that this method is async. You must `await` this method.
     */
    reenter(id: string): Promise<void>;
    /**
     * Hard-kills all conversations for a given identifier. Note that the normal
     * way for conversations to exit is for their conversation builder function
     * to complete (return or throw).
     *
     * If no identifier is specified, all running conversations of all
     * identifiers will be killed.
     *
     * Note that if you call `exit` from within a conversation, the conversation
     * will not terminate immediately once it reaches the `exit` call. Instead,
     * it will continue until it reaches the next `wait` or `skip` statement,
     * and then exit. This is another reason why it is usually easier to return
     * or throw in order to leave a conversation.
     */
    exit(id?: string): Promise<void>;
}
/** Data which the conversations plugin adds to `ctx.session` */
interface ConversationSessionData {
    /** Internal data used by the conversations plugin. Do not modify. */
    conversation?: Record<string, ActiveConversation[]>;
}
interface ActiveConversation {
    /**
     * Log of operations that were performed so far in the conversation. Used to
     * replay past operations when resuming.
     */
    log: OpLog;
}
/**
 * Describes a log entry that does not only know its chronological position in
 * the log which indicates in what order the op was created, but also stores the
 * index at which the operation resolved. This makes it possible to accurately
 * track concurrent operations and deterministically replay the order in which
 * they resolved.
 */
interface AsyncOrder {
    /** Index used to determine the op resolve order */
    i: number;
}
/** Log of operations */
interface OpLog {
    /** Strictly ordered log of incoming updates */
    u: WaitOp[];
}
/** A `wait` call that was recorded onto the log */
interface WaitOp {
    /** Incoming update object used to recreate the context */
    u: Update;
    /**
     * All enumerable properties on the context object which should be persisted
     * in the session and restored when replaying. Excludes intrinsic
     * properties.
     */
    x: Record<string, unknown>;
    /**
     * All properties on the context object, enumerable or not, which could not
     * be persisted and will be proxied to the alive context object.
     */
    f?: string[];
    /** Method-keyed log of async-ordered API call results */
    a?: Record<string, ApiOp[]>;
    /** Log of async-ordered external operation results */
    e?: ExtOp[];
}
/** A Bot API call that was recorded onto the log */
interface ApiOp extends AsyncOrder {
    /** API call result, absent if the call did not complete in time */
    r?: ApiResponse<Awaited<ReturnType<RawApi[keyof RawApi]>>>;
}
/** An external operation that was recorded onto the log */
interface ExtOp extends AsyncOrder {
    /** Result of the task, absent if it did not complete in time */
    r?: {
        /** The operation succeeded and `v` was returned */
        v: any;
    } | {
        /** The operation failed and `e` was thrown */
        e: unknown;
    };
}
/** Ops that can lead to intertuption of function execution */
declare type ResolveOps = "wait" | "skip" | "done";
/**
 * Main installer of the conversations plugin. Call this function and pass the
 * result to `bot.use`:
 *
 * ```ts
 * bot.use(conversations());
 * ```
 *
 * This registers the control panel for conversations which is available through
 * `ctx.conversation`. After installing this plugin, you are already able to
 * exit conversations, even before registering them.
 *
 * Moreover, this function is the prerequisite for being able to register the
 * actual conversations which can in turn be entered.
 *
 * ```ts
 * function settings(conversation: MyConversation, ctx: MyContext) {
 *     // define your conversation here
 * }
 * bot.use(createConversation(settings));
 * bot.command("settings", async (ctx) => {
 *     await ctx.conversation.enter("settings");
 * });
 * ```
 *
 * Check out the [documentation](https://grammy.dev/plugins/conversations.html)
 * to learn more about how to create conversations.
 */
export declare function conversations<C extends Context>(): MiddlewareFn<C & ConversationFlavor>;
/**
 * Takes a conversation builder function, and turns it into grammY middleware
 * which can be installed on your bot. Check out the
 * [documentation](https://grammy.dev/plugins/conversations.html) to learn more
 * about how conversation builder functions can be created.
 *
 * @param builder Conversation builder function
 * @param id Identifier of the conversation, defaults to `builder.name`
 * @returns Middleware to be installed on the bot
 */
export declare function createConversation<C extends Context>(builder: ConversationBuilder<C>, id?: string): MiddlewareFn<C & ConversationFlavor>;
/**
 * > This should be the first parameter in your conversation builder function.
 *
 * This object gives you access to your conversation. You can think of it as a
 * handle which lets you perform basic operations in your conversation, such as
 * waiting for new messages.
 *
 * Typically, a conversation builder function has this signature:
 *
 * ```ts
 * async function greet(conversation: Conversation<MyContext>, ctx: MyContext) {
 *   // define your conversation here
 * }
 * ```
 *
 * It may be helpful to define a type alias.
 *
 * ```ts
 * type MyConversation = Conversation<MyContext>
 *
 * async function greet(conversation: MyConversation, ctx: MyContext) {
 *   // define your conversation here
 * }
 * ```
 *
 * Check out the [documentation](https://grammy.dev/plugins/conversations.html)
 * to learn more about how to create conversations.
 */
export declare type Conversation<C extends Context> = ConversationHandle<C>;
/**
 * Internally used class which acts as a conversation handle.
 */
export declare class ConversationHandle<C extends Context> {
    private readonly ctx;
    private readonly opLog;
    private readonly rsr;
    private replayIndex;
    private currentCtx?;
    private active;
    constructor(ctx: C, opLog: OpLog, rsr: Resolver<ResolveOps>);
    /**
     * Internal method, deactivates the conversation handle. Do not use unless
     * you know exactly what you are doing.
     */
    _deactivate(): void;
    /**
     * Internal flag, `true` if the conversation is currently replaying in order
     * to jump back to an old state, and `false` otherwise. Do not use unless
     * you know exactly what you are doing.
     */
    get _isReplaying(): boolean;
    /**
     * Internal method, replays a wait operation and advances the replay cursor.
     * Do not use unless you know exactly what you are doing.
     */
    _replayWait(): C;
    /**
     * Internal method, replays an API call operation and advances the replay
     * cursor. Do not use unless you know exactly what you are doing.
     */
    _replayApi(method: string): Promise<NonNullable<ApiOp["r"]>>;
    /**
     * Internal method, replays an external operation and advances the replay
     * cursor. Do not use unless you know exactly what you are doing.
     */
    _replayExt(): Promise<NonNullable<ExtOp["r"]>>;
    /**
     * Internal method, logs a wait call. Do not use unless you know exactly
     * what you are doing.
     */
    _logWait(op: WaitOp): void;
    /**
     * Internal method, unlogs the most recent call. Do not use unless you know
     * exactly what you are doing.
     */
    _unlogWait(): WaitOp;
    /**
     * Internal method, logs an API call and returns the assigned slot. Do not
     * use unless you know exactly what you are doing.
     */
    _logApi(method: string): ApiOp;
    /**
     * Internal method, logs an external operation and returns the assigned
     * slot. Do not use unless you know exactly what you are doing.
     */
    _logExt(): ExtOp;
    /**
     * Internal method, finalizes a previously generated slot. Do not use unless
     * you know exactly what you are doing.
     */
    _finalize(slot: AsyncOrder): void;
    /**
     * Internal method, creates a promise from a given value that will resolve
     * at the given index in order to accurately restore the order in which
     * different operations complete. Do not use unless you know exactly what
     * you are doing.
     */
    _resolveAt<T>(index: number, value?: T): Promise<T>;
    /**
     * Waits for a new update (e.g. a message, callback query, etc) from the
     * user. Once received, this method returns the new context object for the
     * incoming update.
     */
    wait(): Promise<C>;
    /**
     * Waits for a new update (e.g. a message, callback query, etc)  that
     * fulfils a certain condition. This condition is specified via the given
     * predicate function. As soon as an update arrives for which the predicate
     * function returns `true`, this method will return it.
     *
     * @param predicate Condition to fulfil
     * @param otherwise Optional handler for discarded updates
     */
    waitUntil<D extends C>(predicate: (ctx: C) => ctx is D, otherwise?: (ctx: C) => unknown | Promise<unknown>): Promise<D>;
    waitUntil(predicate: (ctx: C) => boolean | Promise<boolean>, otherwise?: (ctx: C) => unknown | Promise<unknown>): Promise<C>;
    /**
     * Waits for a new update (e.g. a message, callback query, etc) that does
     * not fulfil a certain condition. This condition is specified via the given
     * predicate function. As soon as an update arrives for which the predicate
     * function returns `false`, this method will return it.
     *
     * @param predicate Condition not to fulfil
     * @param otherwise Optional handler for discarded updates
     */
    waitUnless(predicate: (ctx: C) => boolean | Promise<boolean>, otherwise?: (ctx: C) => unknown | Promise<unknown>): Promise<C>;
    /**
     * Waits for a new update (e.g. a message, callback query, etc) that matches
     * the given filter query. As soon as an update arrives that matches the
     * filter query, the corresponding context object is returned.
     *
     * @param query The filter query to check
     * @param otherwise Optional handler for discarded updates
     */
    waitFor<Q extends FilterQuery>(query: Q | Q[], otherwise?: (ctx: C) => unknown | Promise<unknown>): Promise<Filter<C, Q>>;
    /**
     * Waits for a new update (e.g. a message, callback query, etc) from the
     * given user. As soon as an update arrives from this user, the
     * corresponding context object is returned.
     *
     * @param user The user to wait for
     * @param otherwise Optional handler for discarded updates
     */
    waitFrom(user: number | User, otherwise?: (ctx: C) => unknown | Promise<unknown>): Promise<C & {
        from: User;
    }>;
    /**
     * Utilities for building forms. Contains methods that let you wait for
     * messages and automatically perform input validation.
     */
    form: ConversationForm<C>;
    /**
     * Skips handling the update that was received in the last `wait` call. Once
     * called, the conversation resets to the last `wait` call, as if the update
     * had never been received. The control flow is passed on immediately, so
     * that middleware downstream of the conversation can continue handling the
     * update.
     *
     * Effectively, calling `await conversation.skip()` behaves as if this
     * conversation had not received the update at all.
     *
     * While the conversation rewinds its logs internally, it does not unsend
     * messages that you send between the calls to `wait` and `skip`.
     */
    skip(): Promise<never>;
    /**
     * Safely performs an operation with side-effects. You must use this to wrap
     * all communication with external systems that does not go through grammY,
     * such as database communication or calls to external APIs.
     *
     * This function will then make sure the operation is only performed once,
     * and not every time a message is handled by the conversation.
     *
     * It will need to be able to store the result value of this operation in
     * the session. Hence, it must store and load the result of the operation
     * according to your storage adapter. It is therefore best to only return
     * primitive values or POJOs. If you need to transform your data before it
     * can be stored, you can specify the `beforeStore` function. If you need to
     * transform your data after it was loaded, you can specify the `afterLoad`
     * function.
     *
     * @param op An external operation to perform
     * @returns The result of the operation
     */
    external<F extends (...args: any[]) => any, I = any>(op: F | {
        /** An operation to perform */
        task: F;
        /** Parameters to supply to the operation */
        args?: Parameters<F>;
        /** Prepare the result for storing */
        beforeStore?: (value: Awaited<ReturnType<F>>) => I | Promise<I>;
        /** Recover a result after storing */
        afterLoad?: (value: I) => ReturnType<F> | Promise<ReturnType<F>>;
        /** Prepare the result for storing */
        beforeStoreError?: (value: unknown) => unknown | Promise<unknown>;
        /** Recover a result after storing */
        afterLoadError?: (value: unknown) => unknown;
    }): Promise<Awaited<ReturnType<F>>>;
    /**
     * Safe alias for `ctx.session`. Use this instead of `ctx.session` when
     * inside a conversation.
     *
     * As you call `conversation.wait` several times throughout the
     * conversation, your session data may evolve. The conversations plugin
     * makes sure to track these changes so that your conversation can work
     * correctly each time it is run. This means that there are several
     * snapshots of the session throughout time which all co-exist. It can be
     * cumbersome to always make sure to use the correct session so that the
     * code does not alter history (this would lead to data loss). You should
     * use this helper type to make sure you are accessing the correct session
     * object at all times.
     */
    get session(): C extends {
        session: any;
    } ? C["session"] : never;
    set session(value: C extends {
        session: any;
    } ? C["session"] | undefined : never);
    /**
     * > This method is rarely useful because it freezes your bot and that's
     * > most likely not actually what you want to do. Consider using one of the
     * > variants of `wait` instead.
     *
     * Freezes your bot for the specified number of milliseconds. The current
     * middleware execution will simply stop for a while. Note that if you're
     * processing updates concurrently (with grammY runner) then unrelated
     * updates will still be handled in the meantime. Note further that sleeping
     * during webhooks is dangerous because [it can lead to duplicate
     * updates](https://grammy.dev/guide/deployment-types.html#ending-webhook-requests-in-time).
     *
     * You should use this instead of your own sleeping function so that you
     * don't block the conversation while it is restoring a previous position.
     *
     * @param milliseconds The number of milliseconds to sleep
     */
    sleep(milliseconds: number): Promise<void>;
    /**
     * Safely generates a random number from `Math.random()`. You should use
     * this instead of `Math.random()` in your conversation because
     * non-deterministic behavior is not allowed.
     *
     * @returns A random number
     */
    random(): Promise<number>;
    /**
     * Safely perform `console.log` calls, but only when they should really be
     * logged (so not during replay operations).
     *
     * @param args Arguments to pass to `console.log`
     */
    log(...args: Parameters<typeof console.log>): void;
}
export {};
