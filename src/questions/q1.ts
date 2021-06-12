import { Question } from '../structures/question';

export default class extends Question {
	public constructor() {
		super('1', 'B', 'B is right', '', [
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
		]);
	}
}
