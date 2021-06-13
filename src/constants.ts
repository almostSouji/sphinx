export const QUIZ_SETUP_CMD = (username: string) => `${username}.setup.quiz`;
export const QUIZ_RESET_CD_CMD = (username: string) => `${username}.reset.cooldown`;
export const QUIZ_RESET_LV_CMD = (username: string) => `${username}.reset.level`;
export const QUIZ_CHECK_CMD = (username: string) => `${username}.check`;
export const DEBUG_BACKOFF_CMD = (username: string) => `${username}.debug.backoff`;
export const ON_TIMEOUT = (time: string) => `You are on cooldown. Try again in ${time}!`;
export const COOLDOWN_RESET = (cd: string, lvl: number) => `Cooldown reset: \`${cd}\` | lv: \`${lvl}\``;
export const LEVEL_RESET = (cd: string, lvl: number) => `Level reset: \`${lvl}\` | Coodlown: \`${cd}\``;
export const CHECK = (cd: string, lvl: number, next: string) =>
	`Cooldown: \`${cd}\` | Level: \`${lvl}\` | Next cooldown: \`${next}\``;
export const BUTTON_MESSAGE_TEXT = 'Pass the quiz to gain access!' as const;
export const ERROR_MADE = "That wasn't right..." as const;
export const SUCCESS = 'All correct!' as const;
export const PROGRESS_DONE = '●' as const;
export const PROGRESS_TO_DO = '○' as const;
export const BUTTON_EMOJI_START_QUESTIONS = '❔' as const;
export const BUTTON_LABEL_START_QUESTIONS = 'Start' as const;
export const MAX_LVL = 10 as const;
