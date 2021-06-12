import { stripIndents } from 'common-tags';
import { Question } from '../structures/question';

export default class extends Question {
	public constructor() {
		super(
			'3',
			'B',
			'Why no print?!',
			stripIndents`
				function helloWorld() {
					console.log("Hello World! Pick B")
				}
			`,
			[
				{
					value: 'A',
					description: 'A',
				},
				{
					value: 'B',
					description: 'B',
				},
				{
					value: 'C',
					description: 'C',
				},
			],
		);
	}
}
