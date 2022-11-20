import { createContext, Dispatch } from 'react';
import { z } from 'zod';

export function zFallback<T>(zSchema: z.ZodType<T>, value: T) {
  return z.preprocess((v) => {
    const safe = zSchema.safeParse(v);
    return safe.success ? safe.data : value;
  }, zSchema);
}

const zApiServerConfig = z
  .object({
    enable: zFallback(z.boolean(), true),
    port: zFallback(z.number(), 50930),
  })
  .default({});
export type ApiServerConfig = z.infer<typeof zApiServerConfig>;

const zBouyomiConfig = z
  .object({
    enable: zFallback(z.boolean(), false),
    port: zFallback(z.number(), 50080),
    includeEmoji: zFallback(z.boolean(), false),
    youtube: z
      .object({
        normal: zFallback(z.string(), '$(Message)'),
        superchat: zFallback(
          z.string(),
          '$(Name)さんが$(Amount)スーパーチャットしました $(Message)'
        ),
        membership: zFallback(z.string(), '$(Name)さんがメンバーになりました'),
        membershipGift: zFallback(
          z.string(),
          '$(Name)さんがメンバーシップギフトを送りました'
        ),
      })
      .default({}),
    twitch: z
      .object({
        normal: zFallback(z.string(), '$(Message)'),
        cheer: zFallback(
          z.string(),
          '$(Name)さんが$(Amount)ビッツ送りました $(Message)'
        ),
        sub: zFallback(z.string(), '$(Name)さんがサブスクしました'),
        subPrime: zFallback(
          z.string(),
          '$(Name)さんがプライムでサブスクしました'
        ),
        subGift: zFallback(
          z.string(),
          '$(Name)さんがサブスクギフトを$(GiftNum)個送りました'
        ),
      })
      .default({}),
  })
  .default({});
export type BouyomiConfig = z.infer<typeof zBouyomiConfig>;
export type BouyomiYouTubeConfig = BouyomiConfig['youtube'];
export type BouyomiTwitchConfig = BouyomiConfig['twitch'];

const zTwitchConfig = z
  .object({
    clientId: zFallback(z.string(), 'u7y21ic3v3nsrl9jmxsij78eciy3fl'),
    token: zFallback(z.string(), ''),
  })
  .default({});
export type TwitchConfig = z.infer<typeof zTwitchConfig>;

export const zAppConfig = z.object({
  maxChatItemNum: zFallback(z.number(), 500),
  useSmoothScroll: zFallback(z.boolean(), true),
  intervalMs: zFallback(z.number(), 3000),
  themeName: zFallback(z.string(), 'dark'),
  prevUrl: zFallback(z.array(z.string()), ['']),
  enableAnonyView: zFallback(z.boolean(), false),
  updateCheck: zFallback(z.boolean(), false),
  blockedWords: zFallback(z.array(z.string()), []),
  twitch: zTwitchConfig,
  apiServer: zApiServerConfig,
  bouyomi: zBouyomiConfig,
});
export type AppConfig = z.infer<typeof zAppConfig>;

export const defaultConfig = zAppConfig.parse({});

export function parseObj(rawData: any, def: AppConfig) {
  return {
    ...def,
    ...zAppConfig.parse(rawData),
  };
}

export function copyConfig(appConfig: AppConfig) {
  return zAppConfig.parse(appConfig);
}

export type AppConfigAction = ChangeConfigAction;

interface BaseAction {
  type: string;
}

interface ChangeConfigAction extends BaseAction {
  type: 'CHANGE';
  data: AppConfig;
}

export function appConfigReducer(state: AppConfig, action: AppConfigAction) {
  let res = state;
  switch (action.type) {
    case 'CHANGE': {
      try {
        res = zAppConfig.parse(action.data);
      } catch {}
      break;
    }
  }
  return res;
}

export const AppConfigContext = createContext<{
  state: AppConfig;
  dispatch: Dispatch<AppConfigAction>;
}>({
  state: zAppConfig.parse({}),
  dispatch: () => {},
});
