export class ProductResponseDto {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  supplierId: number | null;
  minStock: number;
  sellingPrice: number;
  importUnit: string | null;
  conversionRate: number;
  description: string | null;
  activeIngredient: string | null;
  pregnancyContraindicated: boolean;
  isActive: boolean;
  totalStock: number;
  supplier: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;

  constructor(product: any) {
    this.id = product.id;
    this.code = product.code;
    this.name = product.name;
    this.category = product.category;
    this.unit = product.unit;
    this.supplierId = product.supplierId;
    this.minStock = product.minStock;
    this.sellingPrice = Number(product.sellingPrice ?? product.dataValues?.sellingPrice ?? 0);
    this.importUnit = product.importUnit ?? product.dataValues?.importUnit ?? null;
    this.conversionRate = Number(product.conversionRate ?? product.dataValues?.conversionRate ?? 1);
    this.description = product.description;
    this.activeIngredient = product.activeIngredient ?? product.dataValues?.activeIngredient ?? null;
    this.pregnancyContraindicated = Boolean(product.pregnancyContraindicated ?? product.dataValues?.pregnancyContraindicated ?? false);
    this.isActive = product.isActive;
    this.totalStock = parseInt(product.dataValues?.totalStock ?? product.totalStock ?? 0, 10);

    this.supplier = product.supplier
      ? { id: product.supplier.id, name: product.supplier.name }
      : null;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }

  static toList(products: any[]): ProductResponseDto[] {
    return products.map(p => new ProductResponseDto(p));
  }
}
