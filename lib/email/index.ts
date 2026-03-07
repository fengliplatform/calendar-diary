// Server-only — NEVER import this file in client components.
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default resend
