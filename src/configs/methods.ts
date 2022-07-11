/** 不需要登录就可以调用的method */
export const freeMethods: Set<string> = new Set(['login']);

/** 必须登录才可以调用的method */
export const authMethods: Set<string> = new Set([]);
