export class SupplierResponseDto {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(supplier: any) {
    this.id = supplier.id;
    this.name = supplier.name;
    this.contactPerson = supplier.contactPerson;
    this.phone = supplier.phone;
    this.email = supplier.email;
    this.address = supplier.address;
    this.isActive = supplier.isActive;
    this.createdAt = supplier.createdAt;
    this.updatedAt = supplier.updatedAt;
  }

  static toList(suppliers: any[]): SupplierResponseDto[] {
    return suppliers.map((s) => new SupplierResponseDto(s));
  }
}
