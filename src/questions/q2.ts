import { stripIndents } from 'common-tags';
import { Question } from '../structures/question';

export default class extends Question {
	public constructor() {
		super(
			'2',
			'E',
			'',
			stripIndents`
				// answer is E
			`,
			[
				{
					value: 'A',
					description: 'desc A',
				},
				{
					value: 'B',
					description: 'desc B',
				},
				{
					value: 'C',
					description: 'desc C',
				},
				{
					value: 'D',
					description: 'desc D',
				},
				{
					value: 'E',
					description: 'desc E',
				},
			],
		);
	}
}
