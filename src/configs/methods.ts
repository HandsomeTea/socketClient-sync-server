/** 不需要登录就可以调用的method */
export const freeMethods: Set<string> = new Set(['login', 'serviceList']);

/** 必须登录才可以调用的method，默认所有的method都需要登录才能调用 */
export const authMethods: Set<string> = new Set([]);
