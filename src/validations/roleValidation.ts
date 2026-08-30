import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên vai trò là bắt buộc' }).min(1).max(100),
    code: z
      .string({ message: 'Mã định danh vai trò là bắt buộc' })
      .min(1)
      .max(50)
      .regex(/^[a-z0-9_]+$/, 'Mã vai trò chỉ được chứa chữ cái thường, số và dấu gạch dưới'),
    color: z.string().max(30).optional().default('blue'),
    description: z.string().max(1000).optional().nullable(),
    cloneFrom: z.string().optional().nullable(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().max(30).optional(),
    description: z.string().max(1000).optional().nullable(),
  }),
});

export const updatePermissionsSchema = z.object({
  body: z.object({
    permissions: z.array(z.string(), { message: 'Danh sách quyền phải là một mảng' }),
  }),
});
