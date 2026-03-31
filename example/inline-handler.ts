/**
 * this is a simplified implementation- various details are omitted.
 * Basic requirement:
 * - be able to have a response with the shape of { message: string; data: T } with a defined response schema.
 * - an abstraction layer to define a default response shape.
 */
import {
	Context,
	Elysia,
	ElysiaCustomStatusResponse,
	RouteSchema,
	SingletonBase,
	status,
	t,
	TSchema
} from '../src'

type TBaseResponse<T = undefined> = undefined extends T
	? { message: string }
	: { message: string; data: T }

const STATUS_MESSAGE = {
	200: { message: 'OK' },
	400: { message: 'BAD' }
}

function does_not_work_with_prettify_wrapper<
	const R extends RouteSchema,
	const S extends SingletonBase,
	const P extends string,
	const Code extends keyof R['response'] & number,
	Data extends R['response'][Code]
>(
	// This doesn't 'work' due to 'Prettify'?
	_context: Context<R, S, P>,
	code: Code,
	data: Data extends { data: infer D } ? D : undefined,
	message?: TBaseResponse
): ElysiaCustomStatusResponse<Code, Data> {
	return status(code, {
		data,
		// @ts-expect-error ...
		...(message ?? STATUS_MESSAGE[code])
	})
}

function response_with_route<
	const T extends { '~Route': RouteSchema },
	const Code extends keyof T['~Route']['response'] & number,
	Data extends T['~Route']['response'][Code]
>(
	_context: T,
	code: Code,
	data: Data extends { data: infer D } ? D : undefined,
	message?: TBaseResponse
): ElysiaCustomStatusResponse<Code, Data> {
	return status(code, {
		// @ts-expect-error ...
		...(message ?? STATUS_MESSAGE[code]),
		data
	})
}

const base = t.Object({ message: t.String() })

function createResponseSchema<T extends TSchema>(schema: T) {
	return t.Intersect([base, t.Object({ data: schema })])
}

export default new Elysia().get(
	'/current',
	(context) => {
		// --- `context` hover Without Prettify<>
		//
		// (parameter) context: Context<NoInfer<IntersectIfObjectSchema<...>>, NoInfer<{
		//     ...;
		// } & {
		//     ...;
		// }>>
		//
		// --- `context` hover With Prettify<>
		//
		// (parameter) context: {
		//     body: unknown;
		//     query: {
		//         name: string;
		//     };
		//     params: {};
		//     headers: Record<string, string | undefined>;
		//     cookie: Record<string, Cookie<unknown>>;
		//     server: Server | null;
		//     redirect: redirect;
		//     set: {
		//         headers: HTTPHeaders;
		//         status?: number | keyof StatusMap;
		//         redirect?: string;
		//         cookie?: Record<string, ElysiaCookie>;
		//     };
		//     ... 4 more ...;
		//     status: SelectiveStatus<...>;
		// }

		if (context.query.name === 'elysia') {
			//  Argument of type '{ body: unknown; query: { name: string; }; params: {}; headers: Record<string, string | undefined>; cookie: Record<string, Cookie<unknown>>; server: Server<unknown> | null; ... 6 more ...; status: SelectiveStatus<...>; }' is not assignable to parameter of type '{ [x: string]: unknown; body: unknown; query: Record<string, string>; params: never; headers: Record<string, string | undefined>; cookie: Record<string, Cookie<unknown>>; ... 7 more ...; status: <const Code extends number | keyof StatusMap, const T = Code extends 301 | ... 59 more ... | 511 ? { ...; }[Code] : Code>(...'.
			//    Types of property 'params' are incompatible.
			//      Type '{}' is not assignable to type 'never'. ts (2345)
			return does_not_work_with_prettify_wrapper(context, 400, {
				result: 'BAD'
			})
		}

		return response_with_route(context, 200, {
			result: 'OK'
		})
	},
	{
		query: t.Object({
			name: t.String()
		}),
		response: {
			200: createResponseSchema(t.Object({ result: t.Literal('OK') })),
			400: createResponseSchema(t.Object({ result: t.Literal('BAD') }))
		}
	}
)
