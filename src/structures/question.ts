export interface Choice {
	value: string;
	description: string;
}

export abstract class Question {
	public id: string;
	public correct: string;
	public choices: Choice[];
	public description: string;
	public code: string;
	public constructor(id: string, correct: string, description: string, code: string, choices: Choice[]) {
		this.id = id;
		this.correct = correct;
		this.description = description;
		this.choices = choices;
		this.code = code;
	}
}
