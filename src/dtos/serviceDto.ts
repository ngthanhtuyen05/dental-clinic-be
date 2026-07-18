export class ServiceResponseDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  price: number;
  unit: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(service: any) {
    this.id = service.id;
    this.code = service.code;
    this.name = service.name;
    this.description = service.description;
    this.categoryId = service.categoryId;
    this.categoryName = service.category?.name || '';
    this.price = parseFloat(service.price);
    this.unit = service.unit;
    this.durationMinutes = service.durationMinutes;
    this.isActive = service.isActive;
    this.createdAt = service.createdAt;
    this.updatedAt = service.updatedAt;
  }

  static toList(services: any[]): ServiceResponseDto[] {
    return services.map((s) => new ServiceResponseDto(s));
  }
}

export class ServiceCategoryResponseDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;

  constructor(cat: any) {
    this.id = cat.id;
    this.code = cat.code;
    this.name = cat.name;
    this.description = cat.description;
    this.sortOrder = cat.sortOrder;
    this.isActive = cat.isActive;
  }

  static toList(categories: any[]): ServiceCategoryResponseDto[] {
    return categories.map((c) => new ServiceCategoryResponseDto(c));
  }
}
