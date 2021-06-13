import { config } from 'dotenv';
import ms from '@naval-base/ms';
import { resolve, join } from 'path';
import {
	Client,
	Collection,
	Intents,
	MessageActionRow,
	MessageSelectMenu,
	Permissions,
	Constants,
	MessageButton,
	GuildMember,
	Snowflake,
} from 'discord.js';
import { readdirSync } from 'fs';
import { Question } from './structures/question';
import { logger } from './util/logger';
import {
	BUTTON_EMOJI_START_QUESTIONS,
	BUTTON_LABEL_START_QUESTIONS,
	BUTTON_MESSAGE_TEXT,
	COOLDOWN_RESET,
	ERROR_MADE,
	ON_TIMEOUT,
	PROGRESS_DONE,
	PROGRESS_TO_DO,
	QUIZ_RESET_CD_CMD,
	QUIZ_RESET_LV_CMD,
	QUIZ_SETUP_CMD,
	SUCCESS,
	LEVEL_RESET,
	DEBUG_BACKOFF_CMD,
	QUIZ_CHECK_CMD,
	CHECK,
	MAX_LVL,
	ALREADY,
	MISSING_ROLE,
	MISSING_PERMISSIONS,
	OTHER_ERROR,
} from './constants';

config({ path: resolve(__dirname, '../.env') });

export const questions = new Collection<string, Question>();
export const cooldowns = new Collection<string, number>();
export const levels = new Collection<string, number>();
const cb = '```' as const;

function progress(reached: number, total: number) {
	return `Progress: ${PROGRESS_DONE.repeat(reached)}${PROGRESS_TO_DO.repeat(total - reached)}`;
}

function backoffInMs(level: number): number {
	return (2 ** level / 4) * 60 * 60 * 1_000;
}

setInterval(() => cooldowns.each((c, k) => Date.now() > c && cooldowns.delete(k)), 60_000);
setInterval(() => levels.each((c, k) => c > MAX_LVL && levels.delete(k)), 60_000);

async function main() {
	const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });

	client.on('ready', () => {
		logger.info(`${client.user!.tag} (${client.user!.id}) ready!`);
	});

	client.on('message', (message) => {
		if (message.author.bot || !message.member?.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
		if (message.content === QUIZ_SETUP_CMD(client.user?.username ?? '')) {
			void message.channel.send({
				content: BUTTON_MESSAGE_TEXT,
				components: [
					new MessageActionRow().addComponents(
						new MessageButton()
							.setCustomID('init-0-')
							.setLabel(BUTTON_LABEL_START_QUESTIONS)
							.setStyle(Constants.MessageButtonStyles.PRIMARY)
							.setEmoji(BUTTON_EMOJI_START_QUESTIONS),
					),
				],
			});
		}
		const [cmd, arg] = message.content.split(/\s+/);
		if (cmd === QUIZ_RESET_CD_CMD(client.user?.username ?? '')) {
			const cd = cooldowns.get(arg);
			const lv = levels.get(arg) ?? 0;
			cooldowns.delete(arg);
			void message.reply({ content: COOLDOWN_RESET(ms((cd ?? Date.now()) - Date.now()), lv) });
		}

		if (cmd === QUIZ_RESET_LV_CMD(client.user?.username ?? '')) {
			const cd = cooldowns.get(arg);
			const lv = levels.get(arg) ?? 0;
			levels.delete(arg);
			void message.reply({ content: LEVEL_RESET(ms((cd ?? Date.now()) - Date.now()), lv) });
		}

		if (cmd === QUIZ_CHECK_CMD(client.user?.username ?? '')) {
			const cd = cooldowns.get(arg);
			const lv = levels.get(arg) ?? 0;
			const nextCd = ms(backoffInMs(lv), true);
			void message.reply({ content: CHECK(ms((cd ?? Date.now()) - Date.now()), lv, nextCd) });
		}

		if (cmd === DEBUG_BACKOFF_CMD(client.user?.username ?? '')) {
			const cds = [...Array(MAX_LVL).keys()].map((v) => `Lv: ${v} | Backoff: ${ms(backoffInMs(v))}`);
			void message.reply({ content: `${cb}js\n${backoffInMs.toString()}\n\n${cds.join('\n')}${cb}` });
		}
	});

	process.on('unhandledRejection', (source) => {
		if (source instanceof Error) {
			logger.error(source);
			process.exit(1);
		}
	});

	client.on('error', (error: Error) => {
		logger.error(error);
	});

	void client.login(process.env.TOKEN);

	const dir = readdirSync(join(__dirname, 'questions')).filter((file) =>
		['.js'].some((ending: string) => file.endsWith(ending)),
	);

	for (const file of dir) {
		const mod = await import(join(__dirname, 'questions', file));
		const qClass = Object.values(mod).find((d: any) => d.prototype instanceof Question) as any;
		const cmd = new qClass();
		questions.set(cmd.id, cmd);
	}

	client.on('interaction', async (i) => {
		if (!(i.member instanceof GuildMember)) return;
		if (i.isMessageComponent()) {
			const [op, , a] = i.customID.split('-');
			const already = a.split('/').filter((e) => e.length);
			const random = questions.filter((q) => !already.includes(q.id)).random();
			if (op === 'init') {
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				if (!random) return;
				const back = cooldowns.get(i.member.user.id);
				const now = Date.now();

				if (i.member instanceof GuildMember && i.member.roles.cache.has((process.env.QUIZ_ROLE ?? '1') as Snowflake)) {
					void i.reply({
						content: ALREADY,
						ephemeral: true,
					});
					return;
				}

				if (back && now < back) {
					void i.reply({
						content: ON_TIMEOUT(ms(back - now, true)),
						ephemeral: true,
					});
					return;
				}

				already.push(random.id);
				const parts = [progress(0, questions.size)];
				if (random.description.length) parts.push(random.description);
				if (random.code.length) parts.push(`${cb}js\n${random.code}\n${cb}`);
				const component = new MessageSelectMenu().setCustomID(`answer-${random.id}-${already.join('/')}`).addOptions(
					random.choices.map((c) => ({
						label: c.value,
						value: c.value,
						description: c.description,
					})),
				);

				const level = levels.get(i.user.id) ?? 0;
				cooldowns.set(i.user.id, now + backoffInMs(level));
				levels.set(i.user.id, level + 1);

				void i.reply({
					content: parts.join('\n'),
					ephemeral: true,
					components: [new MessageActionRow().addComponents(component)],
				});
			}
		}
		if (!i.isSelectMenu()) return;
		const [, id, a] = i.customID.split('-');
		const already = a.split('/').filter((e) => e.length);

		const random = questions.filter((q) => !already.includes(q.id)).random();

		const question = questions.get(id);
		if (!question) return;
		if (!i.values?.includes(question.correct)) {
			void i.update({
				content: ERROR_MADE,
				components: [],
			});
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!random) {
			const role = i.guild?.roles.cache.get((process.env.QUIZ_ROLE ?? '1') as Snowflake);
			if (!role) {
				void i.update({
					content: `${progress(questions.size, questions.size)}\n${SUCCESS}\n${MISSING_ROLE}`,
					components: [],
				});
				return;
			}
			if (!role.editable) {
				void i.update({
					content: `${progress(questions.size, questions.size)}\n${SUCCESS}\n${MISSING_PERMISSIONS}`,
					components: [],
				});
				return;
			}

			try {
				await i.member.roles.add(role);
			} catch (error) {
				logger.error(error);
				void i.update({
					content: `${progress(questions.size, questions.size)}\n${SUCCESS}\n${OTHER_ERROR}`,
					components: [],
				});
				return;
			}

			void i.update({
				content: `${progress(questions.size, questions.size)}\n${SUCCESS}`,
				components: [],
			});
			return;
		}

		already.push(random.id);
		const parts = [progress(already.length - 1, questions.size)];
		if (random.description.length) parts.push(random.description);
		if (random.code.length) parts.push(`${cb}js\n${random.code}\n${cb}`);
		const component = new MessageSelectMenu().setCustomID(`answer-${random.id}-${already.join('/')}`).addOptions(
			random.choices.map((c) => ({
				label: c.value,
				value: c.value,
				description: c.description,
			})),
		);
		void i.update({
			content: parts.join('\n'),
			components: [new MessageActionRow().addComponents(component)],
		});
	});
}

void main();
