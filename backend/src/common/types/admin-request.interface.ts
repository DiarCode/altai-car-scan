import { Request } from 'express'

export interface AdminClaims {
	id: number
}

export interface AdminRequest extends Request {
	admin: AdminClaims
}
