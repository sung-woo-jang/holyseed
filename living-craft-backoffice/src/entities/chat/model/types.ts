import { type conversations } from '../lib/convo.json'

export type ChatUser = (typeof conversations)[number]
export type Convo = ChatUser['messages'][number]
