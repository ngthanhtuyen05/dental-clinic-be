import { z } from 'zod';

export const createSpecialtySchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên chuyên khoa là bắt buộc' })
      .min(1, 'Tên chuyên khoa không được để trống')
      .max(100, 'Tên chuyên khoa tối đa 100 ký tự'),
  }),
});

export const updateSpecialtySchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên chuyên khoa là bắt buộc' })
      .min(1, 'Tên chuyên khoa không được để trống')
      .max(100, 'Tên chuyên khoa tối đa 100 ký tự'),
  }),
});
