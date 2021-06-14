# Sphinx

A simple quiz bot template. Participants have to answer all questions correctly to succeed.

## Commands

commands ares structued like `sphinx.scope.option [...arg]`. Replace `"sphinx"` with the username of the Discord bot account used. All commands require the user to have the `ADMINISTRATOR` permission, as all commands in place are used to reset and debug values.

- `sphinx.setup.quiz` Post the quiz message (can be in a locked channel)
- `sphinx.reset.cooldown <userid>` Reset the cooldown for the supplied user
- `sphinx.reset.level <userid>` Reset the level for the supplied user
- `sphinx.check <userid>` Display the user's current colldown, level and next backoff time
- `sphinx.reload` Reload quiz questions (run after changing `./questions` folder content)
- `sphinx.debug.backoff` Display the Backoff table and function as seen above

## Role Gate

If supplied with the key `.env` key `QUIZ_ROLE` the bot will add the specified role to people successfully taking the quiz and check for it to already be present before allowing the quiz to start. This is completely optional, and the role can be omitted to use the application for fun quizzes

## Questions

Questions are supplied as a `.toml` file (the filename is arbitrary and can be descriptive) to the `./questions` folder, following the following format:

```toml
# unique ID
id = "1"
# correct choice value (question answer)
correct = "A"

# dropdown choices
choices = [
	{ value= "A", description = "Option A (this is correct)"},
	{ value = "B", description = "Option B"},
	{ value = "C", description = "Option C"}
]

# (optional) description to display above the codeblock
description = """
Pick
A\
"""

# (optional) code to display in a codeblock
code = """
function hello() {
	console.log("Hello World")
}
"""
# (optional) language to use for the codeblock highlight
codelanguage = "js"
```

Note that the `id` key value needs to be unique between all questions, else a later entry will overwrite the previous with the same `id`.

## Customize

The file `constants.ts` holds the configurable user facing messages, responses, constants, symbols and emojis used in the application. 

## Backoff

The default backoff function is

```ts
function backoffInMs(level: number): number {
	return (2 ** level / 4) * 60 * 60 * 1_000;
}
```

and results in the following values:

```js
Lv: 0 | Backoff: 15m
Lv: 1 | Backoff: 30m
Lv: 2 | Backoff: 1h
Lv: 3 | Backoff: 2h
Lv: 4 | Backoff: 4h
Lv: 5 | Backoff: 8h
Lv: 6 | Backoff: 16h
Lv: 7 | Backoff: 1d
Lv: 8 | Backoff: 3d
Lv: 9 | Backoff: 5d
```

Meaning after the first attempt a user will have to wait for 15 minutes, after the second, 30 minutes and so on. To customize backoff times you can change this function (note that the return value, as suggested by the function name, should be wait time in milliseconds). A level is gained as soon as the quiz starts to prevent aborting without consequence.

## Setup

Sphinx can be run as standard node process with 

```
npm run build
npm run start
```

Alternatively you can set up as a [docker 🐋](https://www.docker.com/) container with `docker-compose up`.

Note that in either case restarting the application will reset the level and cooldown of every involved user and reload all questions.
