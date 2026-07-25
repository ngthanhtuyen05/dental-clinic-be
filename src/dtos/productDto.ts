export class ProductResponseDto {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  supplierId: number | null;
  minStock: number;
  description: string | null;
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
    this.description = product.description;
    this.isActive = product.isActive;
    this.totalStock = 0; // TODO: compute from stock batches when implemented
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
