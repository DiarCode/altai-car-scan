import { Admin } from '@prisma/client'
import { AdminDto } from '../dtos/admin-management.dtos'

export function mapAdminToDto(admin: Admin): AdminDto {
	return {
		id: admin.id,
		phoneNumber: admin.phoneNumber,
		role: admin.role,
		name: admin.name,
		createdAt: admin.createdAt,
		updatedAt: admin.updatedAt,
	}
}
