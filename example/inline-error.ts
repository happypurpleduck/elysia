import { type } from 'arktype'
import Elysia, { t, ValidationError } from '../src'
import * as z from 'zod'

new Elysia()
	.get('/', (context) => {
		if (context.query.name?.startsWith('test')) {
			const result = new ValidationError(
				'query',
				// typebox works
				// t.Literal('test1'),
				// standard schema-based does work when validation passes
				// z.literal('test1'),
				type('"test1"'),
				context.query.name
			)
			console.info(result.valueError)
			if (result.valueError) {
				throw result
			}
		}

		return 'ok'
	})
	.listen(3333, (s) => {
		console.info(s.url.toString())
	})
