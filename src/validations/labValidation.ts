import { z } from 'zod';

export const createLabOrderSchema = z.object({
  body: z.object({
    patientProfileId: z.number({ message: 'Vui lòng chọn hồ sơ bệnh nhân' }),
    dentistId: z.number({ message: 'Vui lòng chọn bác sĩ chỉ định' }),
    treatmentHistoryId: z.number().optional().nullable(),
    supplierId: z.number({ message: 'Vui lòng chọn xưởng Labo đối tác' }),

    restorationCategory: z.enum([
      'fixed_crown_bridge',
      'veneer_inlay',
      'removable_denture',
      'implant_prosthetics',
      'ortho_appliance',
    ]).default('fixed_crown_bridge'),
    restorationTypeName: z.string({ message: 'Tên loại phục hình là bắt buộc' }).min(2),
    materialName: z.string({ message: 'Tên vật liệu sứ/khí cụ là bắt buộc' }).min(2),
    teethNumbers: z.array(z.number()).min(1, 'Vui lòng chọn ít nhất 1 răng trên sơ đồ'),
    totalUnits: z.number().optional(),

    shadeSystem: z.enum(['vita_classical', 'vita_3d_master', 'bleach', 'custom']).default('vita_classical'),
    shadeMain: z.string({ message: 'Màu sắc chính là bắt buộc' }),
    shadeCervical: z.string().optional().nullable(),
    shadeBody: z.string().optional().nullable(),
    shadeIncisal: z.string().optional().nullable(),
    translucencyLevel: z.enum(['high', 'medium', 'low', 'opaque']).default('medium'),
    characterizationNotes: z.string().optional().nullable(),

    marginDesign: z.enum(['shoulder', 'chamfer', 'knife_edge', 'feather']).default('shoulder'),
    occlusionType: z.enum(['normal', 'relieved_light', 'heavy_contact']).default('normal'),
    proximalContact: z.enum(['point_normal', 'broad_flat', 'tight', 'light']).default('point_normal'),
    ponticDesign: z.enum(['modified_ridge_lap', 'sanitary', 'ovate', 'ridge_lap']).optional().nullable(),

    sentDate: z.string({ message: 'Ngày gửi xưởng là bắt buộc' }),
    frameworkTryInDate: z.string().optional().nullable(),
    deliveryDueDate: z.string({ message: 'Ngày hẹn xưởng giao là bắt buộc' }),
    actualDeliveryDate: z.string().optional().nullable(),
    patientAppointmentDate: z.string().optional().nullable(),

    status: z.enum([
      'draft',
      'sent_to_lab',
      'lab_received',
      'in_fabrication',
      'framework_try_in',
      'delivered_to_clinic',
      'clinical_try_in',
      'adjustment_needed',
      'remake_needed',
      'cemented_done',
      'cancelled',
    ]).default('draft'),

    unitCostPrice: z.number().default(0),
    totalCostPrice: z.number().optional(),
    isPaidToLab: z.boolean().default(false),

    dentistRating: z.number().optional().nullable(),
    dentistFeedback: z.string().optional().nullable(),
    digitalScanFileUrl: z.string().optional().nullable(),
    shadePhotoUrls: z.array(z.string()).optional().nullable(),
    clinicalNotes: z.string().optional().nullable(),
  }),
});

export const updateLabOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID đơn Labo không hợp lệ'),
  }),
  body: z.object({
    patientProfileId: z.number().optional(),
    dentistId: z.number().optional(),
    treatmentHistoryId: z.number().optional().nullable(),
    supplierId: z.number().optional(),
    restorationCategory: z.enum([
      'fixed_crown_bridge',
      'veneer_inlay',
      'removable_denture',
      'implant_prosthetics',
      'ortho_appliance',
    ]).optional(),
    restorationTypeName: z.string().optional(),
    materialName: z.string().optional(),
    teethNumbers: z.array(z.number()).optional(),
    totalUnits: z.number().optional(),
    shadeSystem: z.enum(['vita_classical', 'vita_3d_master', 'bleach', 'custom']).optional(),
    shadeMain: z.string().optional(),
    shadeCervical: z.string().optional().nullable(),
    shadeBody: z.string().optional().nullable(),
    shadeIncisal: z.string().optional().nullable(),
    translucencyLevel: z.enum(['high', 'medium', 'low', 'opaque']).optional(),
    characterizationNotes: z.string().optional().nullable(),
    marginDesign: z.enum(['shoulder', 'chamfer', 'knife_edge', 'feather']).optional(),
    occlusionType: z.enum(['normal', 'relieved_light', 'heavy_contact']).optional(),
    proximalContact: z.enum(['point_normal', 'broad_flat', 'tight', 'light']).optional(),
    ponticDesign: z.enum(['modified_ridge_lap', 'sanitary', 'ovate', 'ridge_lap']).optional().nullable(),
    sentDate: z.string().optional(),
    frameworkTryInDate: z.string().optional().nullable(),
    deliveryDueDate: z.string().optional(),
    actualDeliveryDate: z.string().optional().nullable(),
    patientAppointmentDate: z.string().optional().nullable(),
    status: z.enum([
      'draft',
      'sent_to_lab',
      'lab_received',
      'in_fabrication',
      'framework_try_in',
      'delivered_to_clinic',
      'clinical_try_in',
      'adjustment_needed',
      'remake_needed',
      'cemented_done',
      'cancelled',
    ]).optional(),
    unitCostPrice: z.number().optional(),
    totalCostPrice: z.number().optional(),
    isPaidToLab: z.boolean().optional(),
    dentistRating: z.number().optional().nullable(),
    dentistFeedback: z.string().optional().nullable(),
    digitalScanFileUrl: z.string().optional().nullable(),
    shadePhotoUrls: z.array(z.string()).optional().nullable(),
    clinicalNotes: z.string().optional().nullable(),
  }),
});

export const updateLabOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID đơn Labo không hợp lệ'),
  }),
  body: z.object({
    status: z.enum([
      'draft',
      'sent_to_lab',
      'lab_received',
      'in_fabrication',
      'framework_try_in',
      'delivered_to_clinic',
      'clinical_try_in',
      'adjustment_needed',
      'remake_needed',
      'cemented_done',
      'cancelled',
    ], { message: 'Trạng thái đơn Labo không hợp lệ' }),
    notes: z.string().optional(),
    actualDeliveryDate: z.string().optional(),
  }),
});

export const updateLabOrderPaymentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID đơn Labo không hợp lệ'),
  }),
  body: z.object({
    isPaidToLab: z.boolean({ message: 'isPaidToLab là bắt buộc' }),
  }),
});

export const createLabWarrantyCardSchema = z.object({
  body: z.object({
    labOrderId: z.number().optional().nullable(),
    patientProfileId: z.number({ message: 'Hồ sơ bệnh nhân là bắt buộc' }),
    teethList: z.string({ message: 'Danh sách răng là bắt buộc' }),
    prostheticName: z.string({ message: 'Tên phục hình là bắt buộc' }),
    materialBrand: z.string().default('Chính hãng'),
    warrantyYears: z.number().default(5),
    startDate: z.string({ message: 'Ngày kích hoạt bảo hành là bắt buộc' }),
    endDate: z.string({ message: 'Ngày hết hạn bảo hành là bắt buộc' }),
    warrantyStatus: z.enum(['active', 'expired', 'voided']).default('active'),
    termsAndConditions: z.string().optional().nullable(),
  }),
});
