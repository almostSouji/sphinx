import { config } from 'dotenv';
import { resolve, join } from 'path';
import {
	Client,
	Collection,
	Intents,
	MessageActionRow,
	Snowflake,
	MessageSelectMenu,
	Permissions,
	Constants,
	MessageButton,
} from 'discord.js';
import { readdirSync } from 'fs';
import { Question } from './structures/question';
import { logger } from './util/logger';
import {
	BUTTON_EMOJI_START_QUESTIONS,
	BUTTON_LABEL_START_QUESTIONS,
	BUTTON_MESSAGE_TEXT,
	ERROR_MADE,
	PROGRESS_DONE,
	PROGRESS_TO_DO,
	setupQuizCommand,
	SUCCESS,
} from './constants';

config({ path: resolve(__dirname, '../.env') });

export const questions = new Collection<string, Question>();
export const cooldowns = new Collection<string, Snowflake>();
const cb = '```' as const;

function progress(reached: number, total: number) {
	return `Progress: ${PROGRESS_DONE.repeat(reached)}${PROGRESS_TO_DO.repeat(total - reached)}`;
}

async function main() {
	const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });

	client.on('ready', () => {
		logger.info(`${client.user!.tag} (${client.user!.id}) ready!`);
	});

	client.on('message', (message) => {
		if (message.author.bot || !message.member?.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
		if (message.content === setupQuizCommand(client.user?.username ?? '')) {
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

	client.on('interaction', (i) => {
		if (i.isMessageComponent()) {
			const [op, , a] = i.customID.split('-');
			const already = a.split('/').filter((e) => e.length);
			const random = questions.filter((q) => !already.includes(q.id)).random();
			if (op === 'init') {
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				if (!random) return;
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
